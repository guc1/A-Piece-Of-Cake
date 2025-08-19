import { test, expect } from '@playwright/test';
import { getUserByHandle } from '@/lib/users';
import { createProfileSnapshot } from '@/lib/profile-snapshots';
import { listFlavors } from '@/lib/flavors-store';

const PASSWORD = 'pass1234';

function unique(prefix: string) {
  return `${prefix}${Date.now()}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

test('copy subflavors from historical snapshots', async ({ page, browser }) => {
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

  // go to subflavors
  await page.click('button[id^="f7avsubfbtn"]');

  // create subflavors
  await page.click('button[id^="s7ubflav-add"]');
  await page.click('button[id^="s7ubflav-add-own"]');
  await page.fill('input[id^="s7ubflavourn4me-frm"]', 'PastSub');
  await page.fill('textarea[id^="s7ubflavourde5cr-frm"]', 'sdesc');
  await page.click('button[id^="s7ubflavoursav-frm"]');
  await page.click('button[id^="s7ubflav-add"]');
  await page.click('button[id^="s7ubflav-add-own"]');
  await page.fill('input[id^="s7ubflavourn4me-frm"]', 'LiveSub');
  await page.fill('textarea[id^="s7ubflavourde5cr-frm"]', 'lsdesc');
  await page.click('button[id^="s7ubflavoursav-frm"]');

  // snapshot and delete past subflavor
  const owner = await getUserByHandle(handleOwner);
  await createProfileSnapshot(owner.id, dateStr);
  const pastRow = page.locator('li:has-text("PastSub")');
  await pastRow.locator('button:has-text("Delete")').click();
  await expect(pastRow).toHaveCount(0);

  const ownerFlavors = await listFlavors(String(owner.id));
  const flavorId = ownerFlavors.find((f) => f.name === 'Past')!.id;

  // copy from own history
  await page.goto(`/history/self/${dateStr}/flavors/${flavorId}/subflavors`);
  await page
    .locator('li:has-text("PastSub") button:has-text("Copy")')
    .click();
  await page.selectOption('#copy-dest', flavorId);
  await page.locator('button:has-text("Copy")').last().click();
  await page.goto(`/flavors/${flavorId}/subflavors`);
  await expect(page.locator('li:has-text("PastSub")')).toHaveCount(1);

  // fetch owner's view id
  await page.goto(`/u/${handleOwner}`);
  const viewHref = await page.getAttribute('[id^="pr0ovr-view-"]', 'href');
  const viewId = viewHref?.split('/').pop();

  // viewer signs up and creates a target flavor
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
  await page2.goto('/flavors');
  await page2.click('button[id^="f7av-add"]');
  await page2.click('button[id^="f7av-add-own"]');
  await page2.fill('input[id^="f7avourn4me-frm"]', 'Target');
  await page2.fill('textarea[id^="f7avourde5cr-frm"]', 'desc');
  await page2.click('button[id^="f7avoursav-frm"]');

  const viewerUser = await getUserByHandle(handleViewer);
  const viewerFlavors = await listFlavors(String(viewerUser.id));
  const targetFlavorId = viewerFlavors.find((f) => f.name === 'Target')!.id;

  await page2.goto(`/history/${viewId}/${dateStr}/flavors/${flavorId}/subflavors?to=${targetFlavorId}`);
  await page2
    .locator('li:has-text("PastSub") button:has-text("Copy")')
    .click();
  await page2.selectOption('#copy-dest', targetFlavorId);
  await page2.locator('button:has-text("Copy")').last().click();
  await page2.goto(`/flavors/${targetFlavorId}/subflavors`);
  await expect(page2.locator('li:has-text("PastSub")')).toHaveCount(1);

  // copy current subflavor from live view
  await page2.goto(`/view/${viewId}/flavors/${flavorId}/subflavors?to=${targetFlavorId}`);
  await page2
    .locator('li:has-text("LiveSub") button:has-text("Copy")')
    .click();
  await page2.selectOption('#copy-dest', targetFlavorId);
  await page2.locator('button:has-text("Copy")').last().click();
  await page2.goto(`/flavors/${targetFlavorId}/subflavors`);
  await expect(page2.locator('li:has-text("LiveSub")')).toHaveCount(1);
  await ctx2.close();
});
