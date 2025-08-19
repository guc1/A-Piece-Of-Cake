import { test, expect } from '@playwright/test';

function rgb(hex: string) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgb(${r}, ${g}, ${b})`;
}

test('flavor CRUD and ordering', async ({ page }) => {
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

  // create first flavor
  await page.click('button[id^="f7av-add"]');
  await page.click('button[id^="f7av-add-own"]');
  await page.fill('input[id^="f7avourn4me-frm"]', 'First');
  await page.fill('textarea[id^="f7avourde5cr-frm"]', 'desc1');
  await page.fill('input[name="color"]', '#ff0000');
  await page.click('button:has-text("⭐")');
  await page.fill('input[id^="f7avour1mp-frm"]', '60');
  await page.fill('input[id^="f7avourt4rg-frm"]', '20');
  await page.click('button[id^="f7avoursav-frm"]');
  await expect(page.locator('li:has-text("First")')).toBeVisible();

  // create second flavor with higher importance
  await page.click('button[id^="f7av-add"]');
  await page.click('button[id^="f7av-add-own"]');
  await page.fill('input[id^="f7avourn4me-frm"]', 'Second');
  await page.fill('textarea[id^="f7avourde5cr-frm"]', 'desc2');
  await page.fill('input[name="color"]', '#00ff00');
  await page.click('button:has-text("📚")');
  await page.fill('input[id^="f7avour1mp-frm"]', '80');
  await page.fill('input[id^="f7avourt4rg-frm"]', '30');
  await page.click('button[id^="f7avoursav-frm"]');

  const rows = page.locator('ul[id^="f7avourli5t"] > li');
  await expect(rows.first().locator('div[id^="f7avourn4me"]')).toHaveText(
    'Second',
  );
  await expect(rows.nth(1).locator('div[id^="f7avourn4me"]')).toHaveText(
    'First',
  );

  // avatar sizes compare
  const firstSize = await rows
    .first()
    .locator('div[id^="f7avourava"]')
    .evaluate((el) => el.clientWidth);
  const secondSize = await rows
    .nth(1)
    .locator('div[id^="f7avourava"]')
    .evaluate((el) => el.clientWidth);
  expect(firstSize).toBeGreaterThan(secondSize);

  // edit importance of First to reorder
  await rows.nth(1).click();
  await page.fill('input[id^="f7avour1mp-frm"]', '90');
  await page.click('button[id^="f7avoursav-frm"]');
  await expect(rows.first().locator('div[id^="f7avourn4me"]')).toHaveText(
    'First',
  );

  // edit text/color/icon
  await rows.first().click();
  await page.fill('input[id^="f7avourn4me-frm"]', 'First Updated');
  await page.fill('input[name="color"]', '#0000ff');
  await page.click('button:has-text("Choose Icon")');
  await page.click('button[data-testid="icon-option"]:has-text("❤️")');
  await page.click('button[id^="f7avoursav-frm"]');
  await page.reload();
  await expect(rows.first().locator('div[id^="f7avourn4me"]')).toHaveText(
    'First Updated',
  );
  const color = await rows
    .first()
    .locator('div[id^="f7avourava"]')
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(color).toBe(rgb('#0000ff'));
  await expect(rows.first().locator('div[id^="f7avourava"] span')).toHaveText(
    '❤️',
  );

  // pull icon from other people and store in My Icons
  await rows.first().click();
  await page.click('button:has-text("Choose Icon")');
  await page.click('button:has-text("Other People Icons")');
  await page.click('button:has-text("Alice")');
  await page.click('button[data-testid="icon-option"]:has-text("😎")');
  await page.click('button:has-text("Choose Icon")');
  await page.click('button:has-text("My Icons")');
  await expect(
    page.locator('button[data-testid="icon-option"]:has-text("😎")'),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.click('button[id^="f7avoursav-frm"]');
  await page.reload();
  await expect(rows.first().locator('div[id^="f7avourava"] span')).toHaveText(
    '😎',
  );

  // search flavors
  const flavorSearch = page.locator('input[placeholder="Search flavors…"]');
  await flavorSearch.fill('Second');
  await expect(page.locator('li:has-text("Second")')).toBeVisible();
  await expect(page.locator('li:has-text("First Updated")')).toHaveCount(0);
  await flavorSearch.fill('');

  // keyboard interaction: focus row, open with Enter then close with Esc
  await rows.first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('button[id^="f7avoursav-frm"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('button[id^="f7avoursav-frm"]')).not.toBeVisible();

  // delete flavor
  page.on('dialog', (d) => d.accept());
  await rows.first().locator('button:has-text("Delete")').click();
  await expect(page.locator('li:has-text("First Updated")')).toHaveCount(0);
});
