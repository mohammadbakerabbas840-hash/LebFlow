import { test, expect } from '@playwright/test';

test('assistant has its own route and mobile navigation with an honest demo state', async ({ page }) => {
  await page.setViewportSize({width:375,height:900});
  await page.goto('/');
  await page.getByRole('button',{name:'Toggle navigation'}).click();
  await page.locator('nav').getByRole('button',{name:'AI assistant',exact:true}).click();
  await expect(page).toHaveURL(/#\/assistant$/);
  await expect(page.locator('.sidebar')).not.toHaveClass(/open/);
  await expect(page.getByRole('heading',{name:'Ask LebFlow',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Chat in the connected app'})).toBeVisible();
  await expect(page.locator('textarea')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading',{name:'Chat in the connected app'})).toBeVisible();
  await page.locator('main').getByRole('button',{name:'Explore services',exact:true}).click();
  await expect(page).toHaveURL(/#\/explore$/);
  await page.goBack();
  await expect(page.getByRole('heading',{name:'Ask LebFlow',exact:true})).toBeVisible();
});
