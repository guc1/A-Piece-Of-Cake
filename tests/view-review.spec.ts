import { test, expect } from '@playwright/test';
import { getUserByHandle } from '@/lib/users';
import { listProfileSnapshotDates } from '@/lib/profile-snapshots';

const PASSWORD = 'pass1234';

function unique(prefix: string) {
  return `${prefix}${Date.now()}`;
}

test('review page snapshot and viewing mode', async ({ page }) => {
  const handleOwner = unique('owner');
  const emailOwner = `${handleOwner}@example.com`;

  // sign up owner
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Owner');
  await page.fill('input[placeholder="Handle"]', handleOwner);
  await page.fill('input[placeholder="Email"]', emailOwner);
  await page.fill('input[placeholder="Password"]', PASSWORD);
  await page.click('text=Sign Up');

  const owner = await getUserByHandle(handleOwner);
  let snaps = await listProfileSnapshotDates(owner.id);
  expect(snaps.length).toBe(0);

  // visiting review should create snapshot
  await page.goto('/review');
  await page.waitForTimeout(500);
  snaps = await listProfileSnapshotDates(owner.id);
  expect(snaps.length).toBeGreaterThan(0);

  // fetch view link for owner
  await page.goto(`/u/${handleOwner}`);
  const viewHref = await page.getAttribute('[id^="pr0ovr-view-"]', 'href');

  // sign out
  await page.click('text=Sign out');

  // sign up viewer
  const handleViewer = unique('viewer');
  const emailViewer = `${handleViewer}@example.com`;
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Viewer');
  await page.fill('input[placeholder="Handle"]', handleViewer);
  await page.fill('input[placeholder="Email"]', emailViewer);
  await page.fill('input[placeholder="Password"]', PASSWORD);
  await page.click('text=Sign Up');

  // navigate to owner's review via view link
  await page.goto(`${viewHref}/review`);
  await expect(page).toHaveURL(/\/view\/.*\/review$/);
  await expect(page.locator('textarea')).toHaveCount(2);
  await expect(page.locator('textarea')).toBeDisabled();
});
