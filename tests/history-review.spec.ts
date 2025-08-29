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

test('historical review is read-only for owner and viewer', async ({
  page,
}) => {
  const handleA = unique('owner');
  const emailA = `${handleA}@example.com`;
  const dateStr = yesterday();

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

  await page.goto(`/history/self/${dateStr}/review`);
  const ownerTasks = page.locator('textarea');
  await expect(ownerTasks).toHaveCount(2);
  await expect(ownerTasks.nth(0)).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Generate overview rapport' }),
  ).toHaveCount(0);

  await page.goto(`/u/${handleA}`);
  const viewHref = await page.getAttribute('[id^="pr0ovr-view-"]', 'href');
  const viewId = viewHref?.split('/').pop();

  await page.click('text=Sign out');

  const handleB = unique('viewer');
  const emailB = `${handleB}@example.com`;
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Viewer');
  await page.fill('input[placeholder="Handle"]', handleB);
  await page.fill('input[placeholder="Email"]', emailB);
  await page.fill('input[placeholder="Password"]', PASSWORD);
  await page.click('text=Sign Up');

  await page.goto(`/history/${viewId}/${dateStr}/review`);
  const viewerTasks = page.locator('textarea');
  await expect(viewerTasks).toHaveCount(2);
  await expect(viewerTasks.nth(0)).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Generate overview rapport' }),
  ).toHaveCount(0);
});
