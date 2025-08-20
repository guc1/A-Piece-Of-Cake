import { test, expect } from '@playwright/test';
import { getUserByHandle } from '@/lib/users';
import { savePlan } from '@/lib/plans-store';
import { createProfileSnapshot } from '@/lib/profile-snapshots';

const PASSWORD = 'pass1234';

function unique(prefix: string) {
  return `${prefix}${Date.now()}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function iso(dateStr: string, hour: number) {
  return `${dateStr}T${String(hour).padStart(2, '0')}:00:00`;
}

test('live view shows current future plan while history shows snapshot', async ({
  page,
  browser,
}) => {
  const handleOwner = unique('owner');
  const emailOwner = `${handleOwner}@example.com`;
  const todayStr = today();
  const future = addDays(todayStr, 8);

  // Owner sign up
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Owner');
  await page.fill('input[placeholder="Handle"]', handleOwner);
  await page.fill('input[placeholder="Email"]', emailOwner);
  await page.fill('input[placeholder="Password"]', PASSWORD);
  await page.click('text=Sign Up');

  const owner = await getUserByHandle(handleOwner);
  const oldTitle = 'Alpha';
  const newTitle = 'Beta';
  await savePlan(String(owner.id), future, [
    {
      start: iso(future, 9),
      end: iso(future, 10),
      title: oldTitle,
      description: '',
      color: '#F87171',
    },
  ]);

  await createProfileSnapshot(owner.id, todayStr);
  await new Promise((r) => setTimeout(r, 1000));

  await savePlan(String(owner.id), future, [
    {
      start: iso(future, 9),
      end: iso(future, 10),
      title: newTitle,
      description: '',
      color: '#34D399',
    },
  ]);

  // Viewer sign up
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  const handleViewer = unique('viewer');
  const emailViewer = `${handleViewer}@example.com`;
  await page2.goto('/signup');
  await page2.fill('input[placeholder="Name"]', 'Viewer');
  await page2.fill('input[placeholder="Handle"]', handleViewer);
  await page2.fill('input[placeholder="Email"]', emailViewer);
  await page2.fill('input[placeholder="Password"]', PASSWORD);
  await page2.click('text=Sign Up');

  // Live view should show updated plan
  await page2.goto(`/view/${owner.viewId}/planning/next?date=${future}`);
  await expect(page2.locator(`span:has-text("${newTitle}")`)).toBeVisible();

  // History snapshot should show old plan
  await page2.goto(
    `/history/${owner.viewId}/${todayStr}/planning/next?date=${future}`,
  );
  await expect(page2.locator(`span:has-text("${oldTitle}")`)).toBeVisible();
  await expect(page2.locator(`span:has-text("${newTitle}")`)).toHaveCount(0);

  await ctx2.close();
});
