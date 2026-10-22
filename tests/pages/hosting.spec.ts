import { test, expect } from '@playwright/test';

for (const locale of ['en', 'ar', 'fr'] as const) {
  test(`static ${locale} build works under the repository URL without a backend`, async ({
    page,
  }) => {
    const errors: string[] = [];
    const apiCalls: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (/\/(?:api|sanctum)(?:\/|$)/.test(new URL(request.url()).pathname))
        apiCalls.push(request.url());
    });
    await page.addInitScript(
      (language) => localStorage.setItem('lebflow-language', language),
      locale,
    );
    await page.goto('./');
    await expect(page.locator('.service-card')).toHaveCount(11);
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    const script = page.locator('script[type=module]');
    await expect(script).toHaveAttribute('src', /^\/LebFlow\/assets\//);
    await page
      .locator('nav')
      .getByRole('button', {
        name: { en: 'AI assistant', ar: 'المساعد الذكي', fr: 'Assistant IA' }[locale],
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(/\/LebFlow\/#\/assistant$/);
    await expect(page.locator('.assistant-page .empty-state')).toBeVisible();
    await page.reload();
    await expect(page.locator('.assistant-page .empty-state')).toBeVisible();
    await expect(page.locator('.assistant-page textarea')).toHaveCount(0);
    await page.goBack();
    await expect(page.locator('.service-card').first()).toBeVisible();
    await page.goto('./#/services/passport');
    await expect(page.locator('.documents-section')).toBeVisible();
    await page.reload();
    await expect(page.locator('.documents-section')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('./#/assistant');
    await expect(page.locator('.assistant-page .empty-state')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(errors).toEqual([]);
    expect(apiCalls).toEqual([]);
  });
}
