import { test, expect, Page } from '@playwright/test';

const password = process.env.GUEST_PASSWORD ?? '';

async function signIn(page: Page) {
  await page.goto('/signin');
  await page.fill('input[type="password"]', password);
  await page.click('text=Enter');
  await page.click('text=Flavors');
}

test('flavor CRUD and interactions', async ({ page }) => {
  await signIn(page);

  // Create flavor Alpha
  await page.click('text=+ Flavor');
  await page.fill('input[name="name"]', 'Alpha');
  await page.fill('textarea[name="description"]', 'first');
  await page.fill('input[name="color"]', '#ff0000');
  await page.selectOption('select[name="icon"]', 'heart');
  await page.locator('input[id^="f7avour1mp0-"]').fill('80');
  await page.locator('input[id^="f7avourt4rg0-"]').fill('40');
  await page.click('button:has-text("Save")');

  const firstRow = page.locator('ul li').first();
  await expect(firstRow).toContainText('Alpha');
  const avatar = firstRow.locator('div[id^="f7avourava"]');
  const width = await avatar.evaluate((el) => getComputedStyle(el).width);
  expect(width.startsWith('92')).toBeTruthy();
  const bg = await avatar.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe('rgb(255, 0, 0)');
  await expect(avatar.locator('span')).toHaveText('❤️');

  // Create flavor Beta with lower importance
  await page.click('text=+ Flavor');
  await page.fill('input[name="name"]', 'Beta');
  await page.fill('textarea[name="description"]', 'second');
  await page.fill('input[name="color"]', '#00ff00');
  await page.selectOption('select[name="icon"]', 'star');
  await page.locator('input[id^="f7avour1mp0-"]').fill('20');
  await page.locator('input[id^="f7avourt4rg0-"]').fill('10');
  await page.click('button:has-text("Save")');

  const rows = page.locator('ul li');
  await expect(rows.nth(0)).toContainText('Alpha');
  await expect(rows.nth(1)).toContainText('Beta');

  // Edit Beta
  const betaRow = rows.filter({ hasText: 'Beta' });
  await betaRow.click();
  await page.locator('input[id^="f7avour1mp"]').fill('90');
  await page.fill('textarea[name="description"]', 'second updated');
  await page.fill('input[name="color"]', '#0000ff');
  await page.selectOption('select[name="icon"]', 'smile');
  await page.click('button:has-text("Save")');

  await expect(rows.nth(0)).toContainText('Beta');
  const betaAvatar = rows.nth(0).locator('div[id^="f7avourava"]');
  const betaWidth = await betaAvatar.evaluate((el) => getComputedStyle(el).width);
  expect(betaWidth.startsWith('100')).toBeTruthy();
  await expect(betaAvatar.locator('span')).toHaveText('😊');

  // Reload and check persistence
  await page.reload();
  await expect(page.locator('ul li').first()).toContainText('Beta');

  // Keyboard open/close
  const betaRowAgain = page.locator('ul li').first();
  await betaRowAgain.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).toBeHidden();

  // Delete Beta
  page.once('dialog', (d) => d.accept());
  await betaRowAgain.locator('button:has-text("Delete")').click();
  await expect(page.locator('ul li').first()).not.toContainText('Beta');
});
