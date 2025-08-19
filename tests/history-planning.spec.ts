import { test, expect } from '@playwright/test';

const PASSWORD = 'pass1234';

function unique(prefix: string) {
  return `${prefix}${Date.now()}`;
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

test('viewer can read historical plan without editing', async ({ page }) => {
  const handleA = unique('owner');
  const emailA = `${handleA}@example.com`;
  const dateStr = yesterday();

  // sign up owner and create a plan block for yesterday
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Owner');
  await page.fill('input[placeholder="Handle"]', handleA);
  await page.fill('input[placeholder="Email"]', emailA);
  await page.fill('input[placeholder="Password"]', PASSWORD);
  await page.click('text=Sign Up');
  await page.goto(`/planning/live?apoc_date=${dateStr}&apoc_time=12:00`);
  await page.click('[id^="p1an-add-top-"]');
  await page.fill('input[id^="p1an-meta-ttl-"]', 'Task');
  await page.click('button[id^="p1an-meta-close-"]');
  await page.waitForTimeout(1000);

  // owner can view own historical plan
  await page.goto(`/history/self/${dateStr}/planning`);
  await page.click('[id^="p1an-btn-live-"]');
  await expect(page.locator('[id^="p1an-blk-"]')).toHaveCount(1);
  await page.click('[id^="p1an-blk-"]');
  await expect(page.locator('input[id^="p1an-meta-ttl-"]')).toBeDisabled();
  await expect(page.locator('[id^="p1an-now-"]')).toHaveCount(0);

  // owner review shows all blocks without live bar
  await page.goto(`/history/self/${dateStr}/planning/review`);
  await expect(page.locator('[id^="p1an-now-"]')).toHaveCount(0);
  await page.click('[id^="p1an-blk-"]');
  await expect(page.locator('[id^="p1an-meta-"]')).toBeVisible();

  // fetch view link for owner
  await page.goto(`/u/${handleA}`);
  const viewHref = await page.getAttribute('[id^="pr0ovr-view-"]', 'href');
  const viewId = viewHref?.split('/').pop();

  // sign out
  await page.click('text=Sign out');

  // sign up viewer
  const handleB = unique('viewer');
  const emailB = `${handleB}@example.com`;
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Viewer');
  await page.fill('input[placeholder="Handle"]', handleB);
  await page.fill('input[placeholder="Email"]', emailB);
  await page.fill('input[placeholder="Password"]', PASSWORD);
  await page.click('text=Sign Up');

  // navigate to owner's historical planning as viewer
  await page.goto(`/history/${viewId}/${dateStr}/planning`);
  await page.click('[id^="p1an-btn-live-"]');

  await expect(page.locator('[id^="p1an-blk-"]')).toHaveCount(1);
  await expect(page.locator('[id^="p1an-now-"]')).toHaveCount(0);
  await page.click('[id^="p1an-blk-"]');
  await expect(page.locator('[id^="p1an-meta-"]')).toBeVisible();
  await expect(page.locator('input[id^="p1an-meta-ttl-"]')).toBeDisabled();

  // viewer can open historical review directly
  await page.goto(`/history/${viewId}/${dateStr}/planning/review`);
  await expect(page.locator('[id^="p1an-now-"]')).toHaveCount(0);
  await page.click('[id^="p1an-blk-"]');
  await expect(page.locator('[id^="p1an-meta-"]')).toBeVisible();
});
