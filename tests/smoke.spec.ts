import { test, expect } from '@playwright/test';

test('landing page shows CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Enter app' })).toBeVisible();
});

test('can sign up and reach dashboard', async ({ page }) => {
  const email = `user${Date.now()}@example.com`;
  const password = 'pass1234';
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Tester');
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Password"]', password);
  await page.click('text=Sign Up');
  await expect(page.getByRole('heading', { name: 'Cake' })).toBeVisible();
});
