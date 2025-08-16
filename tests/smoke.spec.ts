import { test, expect } from '@playwright/test';

const password = process.env.GUEST_PASSWORD ?? '';

test('landing page shows CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Enter app' })).toBeVisible();
});

test('can sign in and reach dashboard', async ({ page }) => {
  await page.goto('/signin');
  await page.fill('input[type="password"]', password);
  await page.click('text=Enter');
  await expect(page.getByRole('heading', { name: 'Cake' })).toBeVisible();
});
