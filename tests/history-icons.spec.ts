import { test, expect } from '@playwright/test';
import { getUserByHandle } from '@/lib/users';
import { createProfileSnapshot } from '@/lib/profile-snapshots';

const PASSWORD = 'pass1234';

function unique(prefix: string) {
  return `${prefix}${Date.now()}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

test('historical icons reflect snapshot', async ({ page, browser }) => {
  const handleOwner = unique('owner');
  const emailOwner = `${handleOwner}@example.com`;
  const dateStr = today();

  // Owner sign up and create a flavor with the default star icon
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Owner');
  await page.fill('input[placeholder="Handle"]', handleOwner);
  await page.fill('input[placeholder="Email"]', emailOwner);
  await page.fill('input[placeholder="Password"]', PASSWORD);
  await page.click('text=Sign Up');
  await page.goto('/flavors');
  await page.click('button[id^="f7av-add"]');
  await page.click('button[id^="f7av-add-own"]');
  await page.fill('input[id^="f7avourn4me-frm"]', 'PastIcon');
  await page.fill('textarea[id^="f7avourde5cr-frm"]', 'desc');
  await page.click('button[id^="f7avoursav-frm"]');

  const owner = await getUserByHandle(handleOwner);
  await createProfileSnapshot(owner.id, dateStr);

  // Change flavor icon to heart after snapshot
  const row = page.locator('li:has-text("PastIcon")');
  await row.click();
  await page.click('button:has-text("Choose Icon")');
  await page.click('button[data-testid="icon-option"]:has-text("❤️")');
  await page.click('button[id^="f7avoursav-frm"]');

  // Viewer signs up
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

  // Fetch owner's icons from snapshot
  const res = await page2.request.get(
    `/api/users/${owner.id}/icons?snapshot=${dateStr}`,
  );
  const data = await res.json();
  expect(data.icons).toContain('⭐');
  expect(data.icons).not.toContain('❤️');
  await ctx2.close();
});

