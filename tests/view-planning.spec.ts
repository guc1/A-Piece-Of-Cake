import { test, expect } from '@playwright/test';

// viewer should be able to view next-day plan but not edit
// reuse password for simplicity
const PASSWORD = 'pass1234';

function unique(prefix: string) {
  return `${prefix}${Date.now()}`;
}

test('viewer can read next-day plan without editing', async ({ page }) => {
  const handleA = unique('owner');
  const emailA = `${handleA}@example.com`;

  // sign up owner and create a plan block
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Owner');
  await page.fill('input[placeholder="Handle"]', handleA);
  await page.fill('input[placeholder="Email"]', emailA);
  await page.fill('input[placeholder="Password"]', PASSWORD);
  await page.click('text=Sign Up');

  await page.goto('/planning');
  await page.click('[id^="p1an-btn-next-"]');
  await page.click('[id^="p1an-add-top-"]');
  await page.fill('input[id^="p1an-meta-ttl-"]', 'Task');
  await page.click('button[id^="p1an-meta-save-"]');

  // fetch view link for owner
  await page.goto(`/u/${handleA}`);
  const viewHref = await page.getAttribute('[id^="pr0ovr-view-"]', 'href');

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

  // navigate to owner's planning via view link
  await page.goto(`${viewHref}/planning`);
  await page.click('[id^="p1an-btn-next-"]');

  // verify block is visible and metadata is read-only
  await expect(page.locator('[id^="p1an-blk-"]')).toHaveCount(1);
  await page.click('[id^="p1an-blk-"]');
  await expect(page.locator('[id^="p1an-meta-"]')).toBeVisible();
  await expect(page.locator('button[id^="p1an-meta-save-"]')).toBeDisabled();
  await expect(page.locator('input[id^="p1an-meta-ttl-"]')).toBeDisabled();
});
