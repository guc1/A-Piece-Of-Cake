import { test, expect } from '@playwright/test';

test('live planning shows live ai chat', async ({ page }) => {
  const handle = `user${Date.now()}la`;
  const email = `${handle}@example.com`;
  const password = 'pass1234';
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Tester');
  await page.fill('input[placeholder="Handle"]', handle);
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Password"]', password);
  await page.click('text=Sign Up');
  await page.goto('/planning/live');
  await expect(page.getByRole('button', { name: /Live AI/ })).toBeVisible();
  await page.getByRole('button', { name: /Live AI/ }).click();
  await expect(
    page.locator('input[placeholder="Type your answer..."]')
  ).toBeVisible();
});
