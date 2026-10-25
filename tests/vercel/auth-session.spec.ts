import { test, expect, type Page } from '@playwright/test';

async function fillRegistration(page: Page, email: string) {
  await page.goto('/#/account');
  await page.locator('main').getByRole('button', { name: 'Create account', exact: true }).click();
  for (const [name, value] of Object.entries({
    name: 'Session Resident',
    nameArabic: 'مقيم تجريبي',
    email,
    dob: '1990-01-01',
    password: 'session-test-password-123',
    confirmPassword: 'session-test-password-123',
  })) {
    await page.locator(`input[name="${name}"]`).fill(value);
  }
  await page.locator('.consent-label input').check();
}

async function fillLogin(page: Page, email: string) {
  await page.locator('.login-form input[name=email]').fill(email);
  await page.locator('.login-form input[name=password]').fill('session-test-password-123');
}

test('a slow account response cannot restore a session after sign-out', async ({ page }) => {
  const email = `session-race-${Date.now()}@example.test`;
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let received!: () => void;
  const ready = new Promise<void>((resolve) => {
    received = resolve;
  });
  const order: string[] = [];
  await page.route(
    '**/api/v1/security',
    async (route) => {
      const response = await route.fetch();
      received();
      await held;
      order.push('account-response');
      await route.fulfill({ response });
    },
    { times: 1 },
  );
  page.on('request', (request) => {
    if (request.url().endsWith('/auth/logout')) order.push('logout');
  });
  try {
    await fillRegistration(page, email);
    await page.locator('button[type=submit]').click();
    await expect(
      page.getByRole('heading', { name: 'Session Resident', exact: true }),
    ).toBeVisible();
    await ready;
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    // Keep the authenticated response in flight while the user requests logout.
    await page.waitForTimeout(300);
    release();
    await expect(page.locator('.login-form')).toBeVisible();
    expect(order).toEqual(['account-response', 'logout']);
    expect((await page.request.get('/api/v1/me')).status()).toBe(401);
    await fillLogin(page, email);
    await page.locator('.login-form button.primary').click();
    await expect(
      page.getByRole('heading', { name: 'Session Resident', exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Session Resident', exact: true }),
    ).toBeVisible();
  } finally {
    release();
  }
});

test('registration and login recover from an expired CSRF token without losing form data', async ({
  page,
}) => {
  const email = `expired-csrf-${Date.now()}@example.test`;
  const responses: number[] = [];
  page.on('response', (response) => {
    if (/\/auth\/(register|login)$/.test(response.url())) responses.push(response.status());
  });
  const stale = new Set(['register', 'login']);
  await page.route('**/api/v1/auth/*', async (route) => {
    const headers = { ...route.request().headers() };
    // Exercise Laravel's token fallback for browsers/proxies without fetch metadata.
    // Laravel 13 also accepts a valid Sec-Fetch-Site header independently of the token.
    delete headers['sec-fetch-site'];
    const action = route.request().url().split('/').pop()!;
    if (stale.delete(action)) headers['x-xsrf-token'] = 'expired-test-token';
    // Chromium restores its fetch-metadata headers on continue(); send this request through
    // the API client so the backend really receives the older-browser header set.
    const response = await route.fetch({ headers });
    await route.fulfill({ response });
  });
  await fillRegistration(page, email);
  await page.locator('button[type=submit]').click();
  await expect(page.getByRole('heading', { name: 'Session Resident', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.locator('.login-form')).toBeVisible();
  await fillLogin(page, email);
  await page.locator('.login-form button.primary').click();
  await expect(page.getByRole('heading', { name: 'Session Resident', exact: true })).toBeVisible();
  expect(responses).toEqual([419, 201, 419, 200]);
});

for (const [locale, message] of [
  ['en', 'The email or password is incorrect. Check both or reset your password.'],
  ['ar', 'البريد الإلكتروني أو كلمة المرور غير صحيحة. تحقّق منهما أو أعد تعيين كلمة المرور.'],
  [
    'fr',
    'L’adresse e-mail ou le mot de passe est incorrect. Vérifiez-les ou réinitialisez votre mot de passe.',
  ],
]) {
  test(`invalid credentials show a clear ${locale} message without retrying`, async ({ page }) => {
    await page.addInitScript(
      (language) => localStorage.setItem('lebflow-language', language),
      locale,
    );
    let attempts = 0;
    await page.route('**/api/v1/auth/login', (route) => {
      attempts++;
      return route.fulfill({
        status: 422,
        json: { message: 'The credentials do not match our records.' },
      });
    });
    await page.goto('/#/account');
    await fillLogin(page, 'missing@example.test');
    await page.locator('.login-form button.primary').click();
    await expect(page.locator('.backend-account [role=alert]')).toHaveText(message);
    expect(attempts).toBe(1);
  });
}

for (const [status, attempts, message] of [
  [419, 2, 'Your session has expired. Reload this page and try again.'],
  [429, 1, 'Too many attempts. Please wait a minute before trying again.'],
  [503, 1, 'The server is temporarily unavailable. Please try again shortly.'],
] as const) {
  test(`HTTP ${status} stops safely and explains how to retry`, async ({ page }) => {
    let requests = 0;
    await page.route('**/api/v1/auth/login', (route) => {
      requests++;
      return route.fulfill({ status, json: { message: 'Request rejected.' } });
    });
    await page.goto('/#/account');
    await fillLogin(page, 'synthetic@example.test');
    await page.locator('.login-form button.primary').click();
    await expect(page.locator('.backend-account [role=alert]')).toHaveText(message);
    expect(requests).toBe(attempts);
    await expect(page.locator('.login-form button.primary')).toBeEnabled();
  });
}

test('an existing email explains the registration failure and preserves the form', async ({
  page,
}) => {
  let attempts = 0;
  await page.route('**/api/v1/auth/register', (route) => {
    attempts++;
    return route.fulfill({
      status: 422,
      json: { errors: { email: ['The email has already been taken.'] } },
    });
  });
  await fillRegistration(page, 'existing@example.test');
  await page.locator('button[type=submit]').click();
  await expect(page.locator('.registration-form [role=alert]')).toHaveText(
    'This email is already registered. Sign in or reset your password.',
  );
  await expect(page.locator('input[name=email]')).toHaveValue('existing@example.test');
  await expect(page.locator('input[name=nameArabic]')).toHaveValue('مقيم تجريبي');
  await expect(page.locator('button[type=submit]')).toBeEnabled();
  expect(attempts).toBe(1);
});

test('a stale sign-in screen explains an authenticated redirect instead of following it', async ({
  page,
}) => {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status: 302, headers: { Location: '/' }, body: '' }),
  );
  await page.goto('/#/account');
  await fillLogin(page, 'synthetic@example.test');
  await page.locator('.login-form button.primary').click();
  await expect(page.locator('.backend-account [role=alert]')).toHaveText(
    'Your session changed. Reload this page to check which account is signed in.',
  );
  await expect(page).toHaveURL(/#\/account$/);
});
