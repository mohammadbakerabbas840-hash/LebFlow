import { test, expect } from '@playwright/test';

test('proxy serves JSON, private cookies and API errors instead of the SPA', async ({
  request,
}) => {
  const services = await request.get('/api/v1/services');
  expect(services.status()).toBe(200);
  expect((await services.json()).data).toHaveLength(11);
  expect(services.headers()['cache-control']).toContain('no-store');
  const csrf = await request.get('/sanctum/csrf-cookie');
  expect(csrf.status()).toBe(204);
  expect(csrf.headers()['cache-control']).toContain('no-store');
  const cookies = (await request.storageState()).cookies;
  expect(cookies.some((cookie) => cookie.name === 'XSRF-TOKEN')).toBe(true);
  expect(cookies.every((cookie) => cookie.domain === 'localhost')).toBe(true);
  const missing = await request.get('/api/v1/does-not-exist');
  expect(missing.status()).toBe(404);
  expect(missing.headers()['content-type']).toContain('application/json');
});

for (const locale of ['en', 'ar', 'fr']) {
  test(`connected ${locale} frontend survives navigation and refresh`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(
      (language) => localStorage.setItem('lebflow-language', language),
      locale,
    );
    await page.goto('/');
    await expect(page.locator('.service-card')).toHaveCount(11);
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await page.goto('/#/assistant');
    await page.reload();
    await expect(page.locator('.assistant-page .ai-assistant')).toBeVisible();
    await page.goto('/#/services/passport');
    await expect(page.locator('.documents-section')).toBeVisible();
    await page.reload();
    await expect(page.locator('.documents-section')).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('an HTML fallback or malformed API response shows a recoverable error', async ({ page }) => {
  let failure: 'html' | 'json' | null = 'html';
  await page.route('**/api/v1/me', (route) =>
    failure
      ? route.fulfill({
          status: 200,
          contentType: failure === 'html' ? 'text/html' : 'application/json',
          body: failure === 'html' ? '<html>Wrong deployment</html>' : '{broken',
        })
      : route.continue(),
  );
  await page.goto('/');
  await expect(page.getByRole('alert')).toBeVisible();
  failure = 'json';
  await page.getByRole('button', { name: /try again/i }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  failure = null;
  await page.getByRole('button', { name: /try again/i }).click();
  await expect(page.locator('.service-card')).toHaveCount(11);
});

test('a broken CSRF rewrite does not send login credentials', async ({ page }) => {
  let loginRequests = 0;
  page.on('request', (request) => {
    if (request.url().endsWith('/auth/login')) loginRequests++;
  });
  await page.route('**/sanctum/csrf-cookie', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<html>Wrong deployment</html>' }),
  );
  await page.goto('/#/account');
  await page.locator('.login-form input[name=email]').fill('synthetic@example.test');
  await page.locator('.login-form input[name=password]').fill('synthetic-password-123');
  // The initial stateful API response may already have issued a CSRF cookie.
  await page.context().clearCookies();
  await page.locator('form').getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('.backend-account').getByRole('alert')).toBeVisible();
  expect(loginRequests).toBe(0);
});
