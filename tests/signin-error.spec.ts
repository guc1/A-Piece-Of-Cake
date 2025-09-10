import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001';

test('shows error message on invalid login', async ({ page }) => {
  await page.goto(`${BASE_URL}/signin`);
  await page.getByPlaceholder('Email').fill('wrong@example.com');
  await page.getByPlaceholder('Password').fill('wrongpass');
  await page.getByRole('button', { name: 'Enter' }).click();
  await expect(
    page.getByRole('alert', { name: 'Invalid email or password' }),
  ).toBeVisible();
});
