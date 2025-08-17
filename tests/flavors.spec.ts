import { test, expect } from '@playwright/test';

const password = process.env.GUEST_PASSWORD ?? '';

function rgb(hex: string) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgb(${r}, ${g}, ${b})`;
}

test('flavor CRUD and ordering', async ({ page }) => {
  await page.goto('/signin');
  await page.fill('input[type="password"]', password);
  await page.click('text=Enter');
  await page.goto('/flavors');

  // create first flavor
  await page.click('text=New Flavor');
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await page.fill('input[id^="f7avourn4me"]', 'First');
  await page.fill('textarea[id^="f7avourde5cr"]', 'desc1');
  await page.fill('input[type="color"]', '#ff0000');
  await page.selectOption('select', { value: '⭐' });
  await page.fill('input[id^="f7avour1mp"]', '60');
  await page.fill('input[id^="f7avourt4rg"]', '20');
  await page.click('button:has-text("Save")');
  await expect(page.locator('li:has-text("First")')).toBeVisible();

  // create second flavor with higher importance
  await page.click('text=New Flavor');
  await page.fill('input[id^="f7avourn4me"]', 'Second');
  await page.fill('textarea[id^="f7avourde5cr"]', 'desc2');
  await page.fill('input[type="color"]', '#00ff00');
  await page.selectOption('select', { value: '📚' });
  await page.fill('input[id^="f7avour1mp"]', '80');
  await page.fill('input[id^="f7avourt4rg"]', '30');
  await page.click('button:has-text("Save")');

  const rows = page.locator('ul[id^="f7avourli5t"] > li');
  await expect(rows.first().locator('div[id^="f7avourn4me"]')).toHaveText('Second');
  await expect(rows.nth(1).locator('div[id^="f7avourn4me"]')).toHaveText('First');

  // avatar sizes compare
  const firstSize = await rows.first().locator('div[id^="f7avourava"]').evaluate((el) => el.clientWidth);
  const secondSize = await rows.nth(1).locator('div[id^="f7avourava"]').evaluate((el) => el.clientWidth);
  expect(firstSize).toBeGreaterThan(secondSize);

  // edit importance of First to reorder
  await rows.nth(1).click();
  await page.fill('input[id^="f7avour1mp"]', '90');
  await page.click('button:has-text("Save")');
  await expect(rows.first().locator('div[id^="f7avourn4me"]')).toHaveText('First');

  // edit text/color/icon
  await rows.first().click();
  await page.fill('input[id^="f7avourn4me"]', 'First Updated');
  await page.fill('input[type="color"]', '#0000ff');
  await page.selectOption('select', { value: '❤️' });
  await page.click('button:has-text("Save")');
  await page.reload();
  await expect(rows.first().locator('div[id^="f7avourn4me"]')).toHaveText('First Updated');
  const color = await rows.first().locator('div[id^="f7avourava"]').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(color).toBe(rgb('#0000ff'));
  await expect(rows.first().locator('div[id^="f7avourava"] span')).toHaveText('❤️');

  // keyboard interaction: focus row, open with Enter then close with Esc
  await rows.first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('button:has-text("Save")')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('button:has-text("Save")')).not.toBeVisible();

  // delete flavor
  page.on('dialog', (d) => d.accept());
  await rows.first().locator('button:has-text("Delete")').click();
  await expect(page.locator('li:has-text("First Updated")')).toHaveCount(0);
});
