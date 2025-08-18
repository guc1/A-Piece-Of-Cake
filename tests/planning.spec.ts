import { test, expect } from '@playwright/test';

const PPM = 0.5; // pixels per minute, must match client

function yFor(h: number, m = 0) {
  return (h * 60 + m) * PPM;
}

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
  await page.click('[id^="p1an-add-top-"]');
  const block = page.locator('[id^="p1an-blk-"]');
  await expect(block).toHaveCount(1);
  const top = await block.evaluate((el) => getComputedStyle(el).top);
  expect(parseInt(top)).toBe(0);
  await expect(page.locator('[id^="p1an-meta-"]')).toBeVisible();
  await page.fill('input[id^="p1an-meta-ttl-"]', 'Workout');
  await page.locator('[id^="p1an-meta-col-"] button').nth(1).click();

  // drag to 07:00
  const box = await block.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box!.x + box!.width / 2,
    box!.y + yFor(7) + box!.height / 2,
  );
  await page.mouse.up();

  // resize end to 08:30
  const box2 = await block.boundingBox();
  await page.mouse.move(box2!.x + box2!.width / 2, box2!.y + box2!.height - 1);
  await page.mouse.down();
  await page.mouse.move(
    box2!.x + box2!.width / 2,
    box2!.y + box2!.height + yFor(0, 30),
  );
  await page.mouse.up();

  await page.click('button[id^="p1an-meta-save-"]');
  await expect(page).toHaveURL('/planning/next');
  await expect(page.locator('[id^="p1an-meta-"]')).toHaveCount(0);
  await page.goto('/planning');
  await page.click('[id^="p1an-btn-next-"]');
  const blk2 = page.locator('[id^="p1an-blk-"]');
  const top2 = await blk2.evaluate((el) => parseInt(getComputedStyle(el).top));
  expect(top2).toBe(yFor(7));
});

test('nested block appears on top', async ({ page }) => {
  const handle = `user${Date.now()}n`;
  const email = `${handle}@example.com`;
  const password = 'pass1234';
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Tester');
  await page.fill('input[placeholder="Handle"]', handle);
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Password"]', password);
  await page.click('text=Sign Up');
  await page.goto('/planning');
  await page.click('[id^="p1an-btn-next-"]');

  await page.click('[id^="p1an-add-top-"]');
  const block1 = page.locator('[id^="p1an-blk-"]').nth(0);

  const box1 = await block1.boundingBox();
  await page.mouse.move(box1!.x + box1!.width / 2, box1!.y + box1!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box1!.x + box1!.width / 2,
    box1!.y + yFor(6) + box1!.height / 2,
  );
  await page.mouse.up();
  const box1b = await block1.boundingBox();
  await page.mouse.move(
    box1b!.x + box1b!.width / 2,
    box1b!.y + box1b!.height - 1,
  );
  await page.mouse.down();
  await page.mouse.move(
    box1b!.x + box1b!.width / 2,
    box1b!.y + box1b!.height + yFor(5),
  );
  await page.mouse.up();

  await page.click('[id^="p1an-add-top-"]');
  const block2 = page.locator('[id^="p1an-blk-"]').nth(1);
  const box2 = await block2.boundingBox();
  await page.mouse.move(box2!.x + box2!.width / 2, box2!.y + box2!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box2!.x + box2!.width / 2,
    box2!.y - yFor(4) + box2!.height / 2,
  );
  await page.mouse.up();

  const z1 = await block1.evaluate((el) =>
    parseInt(getComputedStyle(el).zIndex),
  );
  const z2 = await block2.evaluate((el) =>
    parseInt(getComputedStyle(el).zIndex),
  );
  expect(z2).toBeGreaterThan(z1);
});
