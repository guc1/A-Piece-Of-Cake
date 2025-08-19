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

test('copy flavors from historical snapshots', async ({ page, browser }) => {
  page.on('dialog', (d) => d.accept());
  const handleOwner = unique('owner');
  const emailOwner = `${handleOwner}@example.com`;
  const dateStr = today();

  // sign up owner and create a flavor
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Owner');
  await page.fill('input[placeholder="Handle"]', handleOwner);
  await page.fill('input[placeholder="Email"]', emailOwner);
  await page.fill('input[placeholder="Password"]', PASSWORD);
  await page.click('text=Sign Up');
  await page.goto('/flavors');
  await page.click('button[id^="f7av-add"]');
  await page.click('button[id^="f7av-add-own"]');
  await page.fill('input[id^="f7avourn4me-frm"]', 'Past');
  await page.fill('textarea[id^="f7avourde5cr-frm"]', 'desc');
  await page.click('button[id^="f7avoursav-frm"]');

  // snapshot today's profile and delete flavor
  const owner = await getUserByHandle(handleOwner);
  await createProfileSnapshot(owner.id, dateStr);
  const row = page.locator('li:has-text("Past")');
  await row.locator('button:has-text("Delete")').click();
  await expect(page.locator('li:has-text("Past")')).toHaveCount(0);

  // copy from own history
  await page.goto(`/history/self/${dateStr}/flavors`);
  await page.locator('li:has-text("Past")').click();
  await page.click('button:has-text("Copy flavor")');
  await page.goto('/flavors');
  await expect(page.locator('li:has-text("Past")')).toHaveCount(1);

  // fetch owner's view id
  await page.goto(`/u/${handleOwner}`);
  const viewHref = await page.getAttribute('[id^="pr0ovr-view-"]', 'href');
  const viewId = viewHref?.split('/').pop();

  // viewer signs up and copies from owner's history
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
  await page2.goto(`/history/${viewId}/${dateStr}/flavors`);
  await page2.locator('li:has-text("Past")').click();
  await page2.click('button:has-text("Copy flavor")');
  await page2.goto('/flavors');
  await expect(page2.locator('li:has-text("Past")')).toHaveCount(1);
  await ctx2.close();
});
