import { test, expect } from '@playwright/test';

async function signup(page) {
  const handle = `user${Date.now()}`;
  const email = `${handle}@example.com`;
  const password = 'pass1234';
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Tester');
  await page.fill('input[placeholder="Handle"]', handle);
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Password"]', password);
  await page.click('text=Sign Up');
}

test('planning landing and add block', async ({ page }) => {
  await signup(page);
  await page.goto('/planning');
  await expect(page.locator('[id^="p1an-btn-next"]')).toBeVisible();
  await expect(page.locator('[id^="p1an-btn-live"]')).toBeVisible();
  await expect(page.locator('[id^="p1an-btn-review"]')).toBeVisible();
  await page.click('[id^="p1an-btn-next"]');
  await expect(page.locator('[id^="p1an-timecol"]')).toBeVisible();
  await page.click('[id^="p1an-add-top"]');
  const block = page.locator('[id^="p1an-blk-"]').first();
  await expect(block).toBeVisible();
});
