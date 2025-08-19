import { test, expect } from '@playwright/test';

test.use({ timezoneId: 'Europe/Amsterdam' });

test('timezone-safe planning with override', async ({ page }) => {
  const handle = `user${Date.now()}`;
  const email = `${handle}@example.com`;
  const password = 'pass1234';
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Tester');
  await page.fill('input[placeholder="Handle"]', handle);
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Password"]', password);
  await page.click('text=Sign Up');

  // Create next-day plan for 2025-08-19 via override on 2025-08-18
  await page.goto('/planning/next?apoc_date=2025-08-18&apoc_time=21:30');
  await page.click('[id^="p1an-add-top-"]');
  await page.fill('input[id^="p1an-meta-ttl-"]', 'Task');
  await page.click('button[id^="p1an-meta-close-"]');
  await page.waitForTimeout(1000);

  // Live planning on same override date should be empty (2025-08-18)
  await page.goto('/planning/live?apoc_date=2025-08-18&apoc_time=21:30');
  await expect(page.locator('[id^="p1an-blk-"]')).toHaveCount(0);

  // After advancing override to next day, live planning shows saved block (2025-08-19)
  await page.goto('/planning/live?apoc_date=2025-08-19&apoc_time=09:00');
  await expect(page.locator('[id^="p1an-blk-"]')).toHaveCount(1);

  // Next-day plan now targets 2025-08-20 and is independent
  await page.goto('/planning/next?apoc_date=2025-08-19&apoc_time=09:00');
  await expect(page.locator('[id^="p1an-blk-"]')).toHaveCount(0);
});
