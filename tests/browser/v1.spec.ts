import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:5175') ? route.continue() : route.abort());
});
const settled = async (page: Page) => expect(page.locator('main')).toHaveAttribute('aria-busy', 'false');

test('date suggestions work with keyboard activation and reduced-motion preference',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/#/services/civil');
  const suggestion=page.getByRole('group',{name:'Choose a nearby date'}).getByRole('button').first();
  await suggestion.focus();
  await page.keyboard.press('Enter');
  await expect(suggestion).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.appointment-picker input[type=date]')).not.toHaveValue('');
  expect(await page.locator('.appointment-picker').evaluate(element=>getComputedStyle(element).animationName)).toBe('none');
});

test('profile editing validates data, stays private, and clears its draft on sign-out', async ({ page }) => {
  await page.goto('/#/account');
  await page.locator('input[name=name]').fill('Demo Resident');
  await page.locator('input[name=nameArabic]').fill('مقيم تجريبي');
  await page.locator('input[name=dob]').fill('1995-05-12');
  await page.locator('input[name=idNumber]').fill('DEMO-12345');
  await page.locator('input[name=email]').fill('resident@example.com');
  await page.locator('input[name=password]').fill('Demo-password-123');
  await page.locator('input[name=confirmPassword]').fill('Demo-password-123');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZtQAAAAASUVORK5CYII=', 'base64');
  await page.locator('#file-idPhoto').setInputFiles({ name:'sample.png', mimeType:'image/png', buffer:png });
  await page.locator('#file-extract').setInputFiles({ name:'sample.pdf', mimeType:'application/pdf', buffer:Buffer.from('%PDF-1.4\n%%EOF') });
  await page.locator('.consent-label input').check();
  await page.getByRole('button', { name:'Create preview account' }).click();
  await page.getByRole('button', { name:'Edit personal information' }).click();
  const editor = page.locator('.account-settings form');
  await editor.getByLabel('Email address').fill('not-an-email');
  await editor.getByRole('button', { name:'Save profile' }).click();
  await expect(editor.getByRole('alert')).toContainText('valid email');
  await editor.getByLabel('Email address').fill('updated@example.com');
  await editor.getByLabel('Full name as shown on your ID').fill('Updated Resident');
  await editor.getByRole('button', { name:'Save profile' }).click();
  await expect(page.getByRole('heading', { name:'Updated Resident' })).toBeVisible();
  const storage = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  expect(storage).not.toContain('Updated Resident');
  expect(storage).not.toContain('updated@example.com');
  await page.getByRole('button', { name:'Edit personal information' }).click();
  await page.getByRole('button', { name:'Sign out & clear profile' }).click();
  await expect(editor).toHaveCount(0);
  await expect(page.locator('input[name=name]')).toHaveValue('');
});

test('personalized documents flow through demo booking, reload, rescheduling and cancellation', async ({ page }) => {
  await page.goto('/#/services/police');
  await page.getByRole('button', { name: 'Build my checklist' }).click();
  const questions = page.locator('.generic-wizard select');
  await expect(questions).toHaveCount(3);
  for (let i=0;i<3;i++) await questions.nth(i).selectOption('no');
  await page.getByRole('button', { name: 'Generate my checklist' }).click();
  await expect(page.locator('.document-row')).toHaveCount(1);
  await page.locator('.document-row input').check();
  await page.getByRole('button', { name: 'Try a demo appointment', exact: true }).click();
  const demo = page.locator('.demo-booking');
  await demo.getByLabel('Demo branch').selectOption('demo-north');
  await demo.getByLabel('Date', { exact: true }).fill('2099-10-02');
  await demo.getByLabel('Available demo time').selectOption('10:30');
  await demo.getByRole('button', { name: 'Review appointment' }).click();
  await expect(demo).toContainText('North Lebanon demo center');
  await demo.getByRole('button', { name: 'Confirm demo appointment' }).click();
  await expect(demo).toContainText('Demo appointment saved');
  await expect(page.locator('.preparation-summary')).toContainText('1 of 1 documents prepared');
  await settled(page);
  await page.reload();
  await expect(demo).toContainText('DEMO-');
  await demo.getByRole('button', { name: 'Reschedule demo' }).click();
  await demo.getByLabel('Date', { exact: true }).fill('2099-10-03');
  await demo.getByLabel('Available demo time').selectOption('12:00');
  await demo.getByRole('button', { name: 'Review appointment' }).click();
  await demo.getByRole('button', { name: 'Confirm demo appointment' }).click();
  await expect(demo).toContainText('2099-10-03');
  await expect(demo.getByRole('button', { name: 'Cancel demo appointment' })).toBeVisible();
  await demo.getByRole('button', { name: 'Cancel demo appointment' }).click();
  await demo.getByRole('button', { name: 'Keep appointment' }).click();
  await expect(demo).toContainText('DEMO-');
  await demo.getByRole('button', { name: 'Cancel demo appointment' }).click();
  await demo.getByRole('button', { name: 'Confirm cancellation' }).click();
  await expect(demo).toContainText('Demo appointment cancelled');
  await settled(page);
  await page.goto('/#/appointments');
  await expect(page.getByRole('heading', { name: 'No preferred dates yet.' })).toBeVisible();
});

test('notifications, bookmarks, expiry, preferences and read state persist', async ({ page }) => {
  await page.goto('/#/services/driving');
  await page.getByRole('button', { name: 'Save service', exact: true }).click();
  await page.getByLabel('Renewal', { exact: true }).check();
  await page.getByRole('button', { name: 'Build my checklist' }).click();
  await page.getByRole('button', { name: 'Generate my checklist' }).click();
  await expect(page.getByText('Existing driving license', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Create personal request', exact: true }).click();
  await page.getByLabel('Document expiration date (optional)').fill('2020-01-01');
  await page.getByLabel('Current stage').selectOption('Processing');
  await settled(page);
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.locator('nav').getByRole('button', { name: 'Reminders', exact: true }).click();
  const notifications = page.locator('.notifications');
  await expect(notifications).toContainText('Check your document expiration');
  await expect(notifications).toContainText('Finish preparing your documents');
  await expect(notifications).toContainText('Case updated');
  await notifications.getByRole('button', { name: 'Mark all as read' }).click();
  await notifications.getByRole('button', { name: 'Unread', exact: true }).click();
  await expect(notifications).toContainText('You’re all caught up.');
  await page.reload();
  await notifications.getByRole('button', { name: 'Unread', exact: true }).click();
  await expect(notifications).toContainText('You’re all caught up.');
  await page.goto('/#/account');
  await expect(page.locator('.saved-service')).toContainText('Driving license');
  await page.getByLabel('Document expiration reminders').uncheck();
  await page.goto('/#/reminders');
  await expect(notifications).not.toContainText('Check your document expiration');
  await page.goto('/#/account');
  await expect(page.getByLabel('Document expiration reminders')).not.toBeChecked();
  await page.getByRole('button', { name: 'Remove saved service: Driving license' }).click();
  await expect(page.locator('.saved-service')).toHaveCount(0);
});

test('direct routes, missing pages, history navigation and keyboard focus work', async ({ page }) => {
  await page.goto('/#/does-not-exist');
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to services' }).click();
  await page.locator('.service-card').first().click();
  await expect(page).toHaveURL(/services\/police/);
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Judicial record', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goBack();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.locator('.close-button').focus();
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('[role=dialog]'))).toBe(true);
  await page.goto('/#/services/not-real');
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

for (const width of [375, 768, 1440]) for (const locale of ['en','ar','fr']) {
  test(`every page and service fits ${locale} at ${width}px`, async ({ page }) => {
    test.setTimeout(90000);
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(language => {
      localStorage.setItem('lebflow-language', language);
      localStorage.setItem('lebflow-cases', JSON.stringify([{ id:'sample',serviceId:'passport',created:'2026-09-13T12:00:00Z',stage:'Processing',kind:'renewal',documents:['form'],due:'2099-10-02',expiresOn:'2020-01-01',appointment:{date:'2099-10-03',time:'12:00',mode:'demo',branchId:'demo-beirut',reference:'DEMO-12345678'} }]));
    }, locale);
    for (const route of ['explore','assistant','cases','appointments','reminders','account','missing']) {
      await page.goto(`/#/${route}`);
      await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
      await expect(page.locator('.loading-state')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (route === 'account') await page.screenshot({ path: `artifacts/screenshots/v1-account-${locale}-${width}.png`, fullPage: true });
    }
    for (const id of ['passport','driving','police','university','municipality','professional']) {
      await page.goto(`/#/services/${id}`);
      await expect(page.locator('.documents-section')).toBeVisible();
      expect(await page.locator('.modal').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      if (id !== 'passport') {
        await page.locator('.wizard-start').first().click();
        await expect(page.locator('.generic-wizard')).toBeVisible();
        expect(await page.locator('.modal').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      }
    }
    expect(errors).toEqual([]);
  });
}
