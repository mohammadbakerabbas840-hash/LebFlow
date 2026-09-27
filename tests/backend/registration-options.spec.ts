import { test, expect } from '@playwright/test';

test('parent registers without identity attachments or number and starts a first-ID case', async ({page})=>{
  await page.goto('/#/account');
  await page.locator('main').getByRole('button',{name:'Create account',exact:true}).click();
  for(const [name,value] of Object.entries({name:'Sample Parent',nameArabic:'ولي أمر تجريبي',email:`parent-${Date.now()}@example.com`,dob:'1990-01-01',password:'parent-sample-password',confirmPassword:'parent-sample-password'})) {
    await page.locator(`input[name="${name}"]`).fill(value);
  }
  await page.locator('.consent-label input').check();
  const registration=page.waitForResponse(r=>r.url().endsWith('/auth/register'));
  await page.locator('button[type=submit]').click();
  expect((await registration).status()).toBe(201);
  const me=await (await page.request.get('/api/v1/me')).json();
  expect(me.data.idNumberMasked).toBeNull();
  expect(me.data.documents).toEqual([]);
  expect(me.data.nameArabic).toBe('ولي أمر تجريبي');
  await page.goto('/#/services/identity');
  await expect(page.getByText('ID-specific civil-status extract',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Create personal request',exact:true}).click();
  await expect(page.locator('main')).toHaveAttribute('aria-busy','false');
  const cases=await (await page.request.get('/api/v1/cases')).json();
  expect(cases.data[0].serviceId).toBe('identity');
});
