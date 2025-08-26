import { test, expect } from '@playwright/test';

test('progress link and overview', async ({ page }) => {
  const handle = `user${Date.now()}`;
  const email = `${handle}@example.com`;
  const password = 'pass1234';
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Tester');
  await page.fill('input[placeholder="Handle"]', handle);
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Password"]', password);
  await page.click('text=Sign Up');
  await page.click('text=Progress');
  await expect(page.getByRole('link', { name: 'Chat with LLM' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible();
});
