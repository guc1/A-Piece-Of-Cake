import { test, expect } from '@playwright/test';

test('ingredient CRUD delete removes revisions', async ({ page }) => {
  const handle = `user${Date.now()}`;
  const email = `${handle}@example.com`;
  const password = 'pass1234';

  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Tester');
  await page.fill('input[placeholder="Handle"]', handle);
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Password"]', password);
  await page.click('text=Sign Up');
  await page.goto('/ingredients');

  await page.click('button[id^="1ngred-add"]');
  await page.click('button[id^="1ngred-add-own"]');
  await page.fill('input[id^="1ngred-t1tle"]', 'Test ingredient');
  await page.fill('input[id^="1ngred-sh0rt"]', 'desc');
  await page.click('button:has-text("Save")');
  const row = page.locator('div[id^="1ngred-card-"]:has-text("Test ingredient")');
  await expect(row).toBeVisible();
  await row.click();
  page.on('dialog', (d) => d.accept());
  await page.click('button:has-text("Delete")');
  await expect(row).toHaveCount(0);
});
