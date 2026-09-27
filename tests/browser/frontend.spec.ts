import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:5175') ? route.continue() : route.abort());
  await page.goto('/');
});

test('case storage failures preserve session progress and navigation preserves service search', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'lebflow-cases') throw new DOMException('Storage unavailable', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.reload();
  await page.getByRole('textbox', { name: 'Search services' }).fill('passport');
  await expect(page.locator('.service-card')).toHaveCount(1);
  await page.locator('.service-card').click();
  await page.getByRole('button', { name: 'Create personal request', exact: true }).click();
  await page.getByRole('checkbox').first().check();
  await page.getByRole('dialog').getByRole('button', { name: 'View my cases', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Browser storage is unavailable');
  await expect(page.locator('.case-card')).toContainText('1 of 5 documents prepared');
  await page.locator('nav').getByRole('button', { name: 'Explore services', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Search services' })).toHaveValue('passport');
  await expect(page.locator('.service-card')).toHaveCount(1);
});

test('passport wizard personalizes adult and minor checklists and persists answers with a preferred date', async ({ page }) => {
  await page.locator('.service-card').filter({ has: page.getByRole('heading', { name: 'Passport application' }) }).click();
  await page.getByRole('button', { name: 'Personalize your passport checklist' }).click();
  const create = page.getByRole('button', { name: 'Create personal request', exact: true });
  await expect(create).toBeDisabled();
  await page.getByLabel('What are you applying for?').selectOption('renewal');
  await page.getByLabel('Applicant’s age group').selectOption('minor');
  await page.getByLabel('Do you have your previous passport?').selectOption('yes');
  await expect(page.locator('.document-row')).toHaveCount(5);
  await expect(page.locator('.wizard-result')).toContainText('Keep parental consent');
  await page.getByLabel('Applicant’s age group').selectOption('adult');
  await expect(page.locator('.document-row')).toHaveCount(4);
  await expect(page.getByText('Lebanese ID and/or individual civil-status extract', { exact: true })).toBeVisible();
  await page.locator('.appointment-fields input[type=date]').fill('2099-10-02');
  await page.locator('.appointment-fields input[type=time]').fill('10:00');
  await page.getByRole('button', { name: 'Save date & create personal request' }).click();
  await expect(page.locator('.preparation-summary')).toContainText('0 of 4 documents prepared');
  await page.getByRole('checkbox').first().check();
  await expect(page.locator('main')).toHaveAttribute('aria-busy', 'false');
  await page.reload();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel('Applicant’s age group')).toHaveValue('adult');
  await expect(page.getByLabel('What are you applying for?')).toHaveValue('renewal');
  await expect(page.locator('.preparation-summary')).toContainText('1 of 4 documents prepared');
  await expect(page.locator('.appointment-fields input[type=date]')).toHaveValue('2099-10-02');
});

test('passport wizard routes exceptions to official guidance and remains usable in all languages on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 850 });
  await page.locator('.service-card').filter({ has: page.getByRole('heading', { name: 'Passport application' }) }).click();
  await page.getByRole('button', { name: 'Personalize your passport checklist' }).click();
  await page.getByLabel('Applicant’s age group').selectOption('adult');
  await page.getByLabel('Do you have your previous passport?').selectOption('no');
  for (const route of ['lost', 'damaged', 'renewal']) {
    await page.getByLabel('What are you applying for?').selectOption(route);
    await expect(page.getByRole('button', { name: 'Create personal request', exact: true })).toBeDisabled();
    await expect(page.locator('.appointment-fields')).toHaveCount(0);
    await expect(page.locator('.wizard-result')).toContainText('separate General Security guidance');
  }
  await page.getByLabel('What are you applying for?').selectOption('application');
  await expect(page.getByRole('button', { name: 'Create personal request', exact: true })).toBeEnabled();
  for (const locale of ['ar', 'fr', 'en']) {
    // Change via the UI without closing the draft; the modal normally traps keyboard focus.
    await page.locator('.topbar .language-switch select').selectOption(locale);
    await expect(page.locator('.wizard-questions select').first()).toHaveValue('application');
    expect(await page.locator('.modal').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.locator('.passport-wizard').screenshot({ path: `artifacts/screenshots/wizard-${locale}-375.png` });
  }
  await page.getByRole('button', { name: 'Use the general guide instead' }).click();
  await expect(page.locator('.document-row')).toHaveCount(5);
  await expect(page.getByRole('button', { name: 'Create personal request', exact: true })).toBeEnabled();
});

test('language switching translates services and preserves request state, including Arabic RTL', async ({ page }) => {
  await page.locator('.service-card').filter({ has: page.getByRole('heading', { name: 'Passport application' }) }).click();
  await page.getByRole('button', { name: 'Create personal request', exact: true }).click();
  await page.getByRole('checkbox').first().check();
  await page.getByLabel('Current stage').selectOption('Ready to submit');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.locator('.topbar .language-switch select').selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.locator('.service-card').filter({ has: page.getByRole('heading', { name: 'طلب جواز سفر' }) }).click();
  await expect(page.getByRole('heading', { name: 'المستندات المطلوبة' })).toBeVisible();
  await expect(page.getByRole('checkbox').first()).toBeChecked();
  await expect(page.getByLabel('المرحلة الحالية')).toHaveValue('Ready to submit');
  await page.getByRole('button', { name: 'إغلاق', exact: true }).click();
  await page.locator('.topbar .language-switch select').selectOption('fr');
  await expect(page.getByRole('heading', { name: 'Votre prochaine étape commence ici.' })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});

test('preferred appointment creation, persistence, editing, and removal never claim an official booking', async ({ page }) => {
  await page.locator('.service-card').filter({ has: page.getByRole('heading', { name: 'Driving license' }) }).click();
  await expect(page.getByText('Live availability is not connected.', { exact: false })).toBeVisible();
  await page.getByLabel('Renewal', { exact: true }).check();
  await page.locator('.appointment-fields input[type=date]').fill('2020-01-01');
  await page.locator('.appointment-fields input[type=time]').fill('10:00');
  await page.getByRole('button', { name: 'Save date & create personal request' }).click();
  await expect(page.getByRole('alert')).toContainText('future date');
  await page.locator('.appointment-fields input[type=date]').fill('2099-10-02');
  await page.getByRole('button', { name: 'Save date & create personal request' }).click();
  await expect(page.getByRole('status')).toContainText('Preferred date saved');
  await expect(page.getByLabel('Required documents', { exact: true }).getByText('Existing driving license', { exact: true })).toBeVisible();
  await expect(page.getByText('Training and test documents, if applicable', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.locator('nav').getByRole('button', { name: /Appointments/ }).click();
  await expect(page.locator('.case-card')).toContainText('2099');
  await page.reload();
  await page.locator('nav').getByRole('button', { name: /Appointments/ }).click();
  await page.locator('.case-card').click();
  await expect(page.locator('.appointment-fields input[type=date]')).toHaveValue('2099-10-02');
  await page.locator('.appointment-fields input[type=time]').fill('11:30');
  await page.getByRole('button', { name: 'Save preferred date', exact: true }).click();
  await page.getByRole('button', { name: 'Remove preferred date' }).click();
  await expect(page.getByRole('status')).toContainText('No government booking was cancelled');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No preferred dates yet.' })).toBeVisible();
});

test('registration supports optional uploads, rejects disguised files, and keeps identity out of storage', async ({ page }) => {
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await page.getByRole('button', { name: 'Create preview account' }).click();
  await expect(page.locator('#error-idPhoto')).toBeEmpty();
  await expect(page.locator('#error-nameArabic')).not.toBeEmpty();
  await page.locator('input[name=name]').fill('Sample Person');
  await page.locator('input[name=nameArabic]').fill('شخص تجريبي');
  await page.locator('input[name=dob]').fill('1995-05-12');
  await page.locator('input[name=idNumber]').fill('SAMPLE-123456');
  await page.locator('input[name=email]').fill('sample@example.com');
  await page.locator('input[name=password]').fill('Sample-password-1234');
  await page.locator('input[name=confirmPassword]').fill('Sample-password-1234');
  await page.locator('#file-idPhoto').setInputFiles({ name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });
  await expect(page.locator('#error-idPhoto')).toContainText('does not match');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZtQAAAAASUVORK5CYII=', 'base64');
  await page.locator('#file-idPhoto').setInputFiles({ name: 'sample-id.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByText('sample-id.png', { exact: true })).toBeVisible();
  await page.locator('#file-extract').setInputFiles({ name: 'sample-extract.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% SAMPLE DOCUMENT ONLY\n%%EOF') });
  await expect(page.getByText('sample-extract.pdf', { exact: true })).toBeVisible();
  await page.locator('.topbar .language-switch select').selectOption('ar');
  await expect(page.locator('input[name=name]')).toHaveValue('Sample Person');
  await page.locator('.consent-label input').check();
  await page.getByRole('button', { name: 'إنشاء حساب تجريبي', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sample Person' })).toBeVisible();
  const storage = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
  expect(storage).not.toContain('SAMPLE-123456');
  expect(storage).not.toContain('Sample Person');
  expect(storage).not.toContain('Sample-password');
  expect(storage).not.toContain('sample-id.png');
  await page.getByRole('button', { name: 'الخروج ومسح الملف الشخصي' }).click();
  await expect(page.locator('input[name=name]')).toHaveValue('');
  await expect(page.locator('input[name=idNumber]')).toHaveValue('');
  await expect(page.getByText('sample-id.png', { exact: true })).toHaveCount(0);
});

test('all languages fit mobile and desktop without horizontal overflow or runtime errors', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 950 });
    for (const locale of ['en', 'ar', 'fr']) {
      await page.locator('.topbar .language-switch select').selectOption(locale);
      await page.evaluate(() => window.scrollTo(0, 0));
      if (width === 375) await expect(page.locator('.sidebar')).not.toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `artifacts/screenshots/home-${locale}-${width}.png`, fullPage: true });
      await page.locator('.service-card').first().click();
      expect(await page.locator('.modal').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      await page.screenshot({ path: `artifacts/screenshots/service-${locale}-${width}.png` });
      await page.locator('.close-button').click();
      await page.locator('.account-button').click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `artifacts/screenshots/registration-${locale}-${width}.png`, fullPage: true });
      await page.goto('/');
    }
  }
  expect(errors).toEqual([]);
});

test('conditional documents and reminders work across reloads without claiming all attachments are mandatory', async ({ page }) => {
  await page.locator('.service-card').filter({ has: page.getByRole('heading', { name: 'Passport application' }) }).click();
  await page.getByRole('button', { name: 'Create personal request', exact: true }).click();
  await page.getByRole('button', { name: 'Does not apply to my case' }).click();
  await expect(page.locator('.preparation-summary')).toContainText('0 of 4 documents prepared');
  await expect(page.locator('.preparation-summary')).toContainText('1 not applicable');
  await page.getByRole('checkbox').first().check();
  await page.getByLabel('Next action reminder').fill('2099-10-03');
  await page.getByRole('dialog').getByRole('button', { name: 'View my cases', exact: true }).click();
  await expect(page.locator('.case-card')).toContainText('1 of 4 documents prepared');
  await page.locator('nav').getByRole('button', { name: 'Reminders', exact: true }).click();
  await expect(page.locator('.case-card')).toContainText('2099');
  await page.reload();
  await page.locator('nav').getByRole('button', { name: 'Reminders', exact: true }).click();
  await page.locator('.case-card').click();
  await expect(page.getByRole('button', { name: 'Include this document again' })).toBeVisible();
  await page.getByRole('button', { name: 'Include this document again' }).click();
  await expect(page.locator('.preparation-summary')).toContainText('1 of 5 documents prepared');
  await page.getByLabel('Next action reminder').fill('');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A little reminder goes a long way.' })).toBeVisible();
});

test('mobile navigation opens and closes in RTL; service dialog supports keyboard escape', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 850 });
  await page.locator('.topbar .language-switch select').selectOption('ar');
  await page.locator('.mobile-toggle').click();
  await expect(page.locator('.sidebar')).toBeVisible();
  await page.locator('nav').getByRole('button', { name: 'المواعيد', exact: true }).click();
  await expect(page.locator('.sidebar')).not.toBeVisible();
  await page.locator('.mobile-toggle').click();
  await page.locator('nav').getByRole('button', { name: 'استكشف الخدمات', exact: true }).click();
  await page.locator('.service-card').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
