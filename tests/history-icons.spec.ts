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

test('historical icon lists reflect snapshot', async ({ page }) => {
  const handle = unique('iconuser');
  const email = `${handle}@example.com`;
  const dateStr = today();

  // sign up user and save an icon
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Icon User');
  await page.fill('input[placeholder="Handle"]', handle);
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Password"]', PASSWORD);
  await page.click('text=Sign Up');
  await page.evaluate(async () => {
    await fetch('/api/my-icons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ icons: ['🍩'] }),
    });
  });

  const owner = await getUserByHandle(handle);
  await createProfileSnapshot(owner.id, dateStr);

  // clear current icons
  await page.evaluate(async () => {
    await fetch('/api/my-icons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ icons: [] }),
    });
  });

  const resNow = await page.request.get(`/api/users/${owner.id}/icons`);
  const nowData = await resNow.json();
  expect(nowData.icons).not.toContain('🍩');

  const resHist = await page.request.get(
    `/api/users/${owner.id}/icons?at=${dateStr}`,
  );
  const histData = await resHist.json();
  expect(histData.icons).toContain('🍩');
});
