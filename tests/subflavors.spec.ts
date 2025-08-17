import { test, expect } from '@playwright/test';

test('subflavor CRUD', async ({ page }) => {
  const handle = `user${Date.now()}`;
  const email = `${handle}@example.com`;
  const password = 'pass1234';
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Tester');
  await page.fill('input[placeholder="Handle"]', handle);
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Password"]', password);
  await page.click('text=Sign Up');
  await page.goto('/flavors');

  // create a flavor to attach subflavors
  await page.click('text=New Flavor');
  await page.fill('input[id^="f7avourn4me-frm"]', 'Main');
  await page.fill('textarea[id^="f7avourde5cr-frm"]', 'maindesc');
  await page.fill('input[name="color"]', '#ff0000');
  await page.click('button:has-text("⭐")');
  await page.fill('input[id^="f7avour1mp-frm"]', '60');
  await page.fill('input[id^="f7avourt4rg-frm"]', '20');
  await page.click('button[id^="f7avoursav-frm"]');

  // go to subflavors
  await page.click('button[id^="f7avsubfbtn"]');

  // create subflavor
  await page.click('text=New Subflavor');
  await page.fill('input[id^="s7ubflavourn4me-frm"]', 'Sub1');
  await page.fill('textarea[id^="s7ubflavourde5cr-frm"]', 'sdesc');
  await page.fill('input[name="color"]', '#00ff00');
  await page.click('button:has-text("📚")');
  await page.fill('input[id^="s7ubflavour1mp-frm"]', '70');
  await page.fill('input[id^="s7ubflavourt4rg-frm"]', '30');
  await page.click('button[id^="s7ubflavoursav-frm"]');
  await expect(page.locator('li:has-text("Sub1")')).toBeVisible();

  const rows = page.locator('ul[id^="s7ubflavourli5t"] > li');
  await rows.first().click();
  await page.fill('input[id^="s7ubflavour1mp-frm"]', '80');
  await page.click('button[id^="s7ubflavoursav-frm"]');
  await expect(rows.first().locator('div[id^="s7ubflavourn4me"]')).toHaveText(
    'Sub1',
  );

  // delete subflavor
  page.on('dialog', (d) => d.accept());
  await rows.first().locator('button:has-text("Delete")').click();
  await expect(page.locator('li:has-text("Sub1")')).toHaveCount(0);
});
