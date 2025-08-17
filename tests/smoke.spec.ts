import { test, expect } from '@playwright/test';

const email = `smoke${Date.now()}@example.com`;
const password = 'pass123';

test('landing page shows CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
});

test('can sign up and reach dashboard', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Tester');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('text=Create account');
  await expect(page.getByRole('heading', { name: 'Cake' })).toBeVisible();
});
