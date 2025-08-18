import { test, expect } from '@playwright/test';

test('next day planning flow', async ({ page }) => {
  const handle = `user${Date.now()}`;
  const email = `${handle}@example.com`;
  const password = 'pass1234';
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Tester');
  await page.fill('input[placeholder="Handle"]', handle);
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Password"]', password);
  await page.click('text=Sign Up');
  await page.goto('/planning');

  await expect(page.locator('[id^="p1an-btn-next-"]')).toBeVisible();
  await expect(page.locator('span.bg-red-500')).toBeVisible();
  await expect(page.locator('[id^="p1an-btn-review-"]')).toBeVisible();

  await page.click('[id^="p1an-btn-next-"]');
  await expect(page.locator('[id^="p1an-timecol-"]')).toBeVisible();
  await expect(page.locator('text=23:00')).toBeVisible();
  await page.click('[id^="p1an-add-top-"]');
  const block = page.locator('[id^="p1an-blk-"]');
  await expect(block).toHaveCount(1);
  const top0 = await block.evaluate((el) => parseFloat(getComputedStyle(el).top));
  expect(top0).toBeCloseTo(0);
  const box = await block.boundingBox();
  const ppm = box!.height / 60;
  const gridBox = await block.evaluate((el) => {
    const r = el.parentElement!.getBoundingClientRect();
    return { y: r.y };
  });
  await expect(page.locator('[id^="p1an-meta-"]')).toBeVisible();
  await page.fill('input[id^="p1an-meta-ttl-"]', 'Workout');
  await page.locator('[id^="p1an-meta-col-"] button').nth(1).click();

  const yFor = (h: number, m = 0) => (h * 60 + m) * ppm;

  // drag to 07:00
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box!.x + box!.width / 2,
    gridBox.y + yFor(7) + box!.height / 2,
  );
  await page.mouse.up();

  // resize end to 08:30
  const box2 = await block.boundingBox();
  await page.mouse.move(box2!.x + box2!.width / 2, box2!.y + box2!.height);
  await page.mouse.down();
  await page.mouse.move(
    box2!.x + box2!.width / 2,
    gridBox.y + yFor(8, 30),
  );
  await page.mouse.up();

  await page.click('button[id^="p1an-meta-save-"]');
  await expect(page).toHaveURL(/\/planning\/next$/);
  await expect(page.locator('[id^="p1an-meta-"]')).toHaveCount(0);
  await page.reload();
  const blk2 = page.locator('[id^="p1an-blk-"]');
  const box3 = await blk2.boundingBox();
  const ppmReload = box3!.height / 90; // 90 min duration
  const yForReload = (h: number, m = 0) => (h * 60 + m) * ppmReload;
  const top2 = await blk2.evaluate((el) => parseFloat(getComputedStyle(el).top));
  expect(top2).toBeCloseTo(yForReload(7));
  const height2 = await blk2.evaluate((el) => parseFloat(getComputedStyle(el).height));
  expect(height2).toBeCloseTo(yForReload(8, 30) - yForReload(7));
});
