import { expect, test } from '@playwright/test';

test('mobile navigation works with touch and has no horizontal scroll', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: 'Menu' }).tap();
  const drawer = page.getByRole('dialog', { name: 'Site menu' });
  await expect(drawer).toBeVisible();
  await drawer.getByRole('button', { name: 'Research' }).tap();
  await drawer.getByRole('link', { name: 'Publications & Resources' }).tap();
  await expect(page).toHaveURL(/\/publications$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Publications & Resources' })).toBeVisible();
});

test('legacy WordPress URLs redirect to their new pages', async ({ page }) => {
  await page.goto('/about-us/centre-driectors-message/');
  await expect(page).toHaveURL(/\/about\/directors-message$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Director');
});
