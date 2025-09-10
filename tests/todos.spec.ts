import { test, expect } from '@playwright/test';

// Ensure users can complete and delete to-dos
// by verifying UI state changes

test('complete and delete todo', async ({ page }) => {
  const handle = `user${Date.now()}`;
  const email = `${handle}@example.com`;
  const password = 'pass1234';
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Tester');
  await page.fill('input[placeholder="Handle"]', handle);
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Password"]', password);
  await page.click('text=Sign Up');

  await page.goto('/todos');
  await page.click('button[id^="todo-add-"]');
  await page.fill('input[id^="todo-title-"]', 'Task1');
  await page.click('button[id^="todo-submit-"]');
  const row = page.locator('li:has-text("Task1")');
  await expect(row).toBeVisible();

  await row.locator('button:has-text("Completed")').click();
  await expect(row).toHaveClass(/bg-green-100/);

  await row.locator('button:has-text("Delete")').click();
  await expect(page.locator('li:has-text("Task1")')).toHaveCount(0);
  await expect(page.locator('text=No to-dos yet.')).toBeVisible();
});
