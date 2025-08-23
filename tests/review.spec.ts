import { test, expect } from '@playwright/test';

const PASSWORD = 'pass1234';

function unique(prefix: string) {
  return `${prefix}${Date.now()}`;
}

test('owner review page loads', async ({ page }) => {
  const handle = unique('rev');
  const email = `${handle}@example.com`;
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Tester');
  await page.fill('input[placeholder="Handle"]', handle);
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Password"]', PASSWORD);
  await page.click('text=Sign Up');
  await page.goto('/review');
  await expect(
    page.getByRole('button', { name: 'Review daily aim' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Write general day vibe' }),
  ).toHaveCount(0);

  // ensure columns scroll independently
  const columns = page.locator('section > div');
  const left = columns.first();
  const right = columns.nth(1);
  await left.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  const rightTop = await right.evaluate((el) => el.scrollTop);
  expect(rightTop).toBe(0);
});

test('viewer review page is read-only', async ({ page }) => {
  const ownerHandle = unique('owner');
  const ownerEmail = `${ownerHandle}@example.com`;
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Owner');
  await page.fill('input[placeholder="Handle"]', ownerHandle);
  await page.fill('input[placeholder="Email"]', ownerEmail);
  await page.fill('input[placeholder="Password"]', PASSWORD);
  await page.click('text=Sign Up');

  await page.goto(`/u/${ownerHandle}`);
  const viewHref = await page.getAttribute('[id^="pr0ovr-view-"]', 'href');
  await page.click('text=Sign out');

  const viewerHandle = unique('viewer');
  const viewerEmail = `${viewerHandle}@example.com`;
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Viewer');
  await page.fill('input[placeholder="Handle"]', viewerHandle);
  await page.fill('input[placeholder="Email"]', viewerEmail);
  await page.fill('input[placeholder="Password"]', PASSWORD);
  await page.click('text=Sign Up');

  await page.goto(`${viewHref}/review`);
  const tasks = page.locator('textarea');
  await expect(tasks).toHaveCount(2);
  await expect(tasks.nth(0)).toBeDisabled();
  await expect(tasks.nth(1)).toBeDisabled();
});
