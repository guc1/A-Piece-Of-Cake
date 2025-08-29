import { test, expect } from '@playwright/test';
import { getUserByHandle } from '@/lib/users';
import { createProfileSnapshot } from '@/lib/profile-snapshots';

const PASSWORD = 'pass1234';

function unique(prefix: string) {
  return `${prefix}${Date.now()}`;
}

test('viewer sees live ai chat read-only', async ({ page }) => {
  const handleA = unique('owner');
  const emailA = `${handleA}@example.com`;
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Owner');
  await page.fill('input[placeholder="Handle"]', handleA);
  await page.fill('input[placeholder="Email"]', emailA);
  await page.fill('input[placeholder="Password"]', PASSWORD);
  await page.click('text=Sign Up');
  await page.goto('/planning/live');
  const today = new Date().toISOString().slice(0, 10);
  await page.evaluate(async (today) => {
    await fetch('/api/planning/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: today,
        mode: 'live',
        chatId: 'abc',
        messages: [
          {
            role: 'assistant',
            content: 'hello',
            createdAt: `${today}T00:00:00.000Z`,
          },
          {
            role: 'user',
            content: 'hi',
            createdAt: `${today}T01:00:00.000Z`,
          },
        ],
      }),
    });
  }, today);
  await page.goto(`/u/${handleA}`);
  const viewHref = await page.getAttribute('[id^="pr0ovr-view-"]', 'href');
  await page.click('text=Sign out');

  const handleB = unique('viewer');
  const emailB = `${handleB}@example.com`;
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Viewer');
  await page.fill('input[placeholder="Handle"]', handleB);
  await page.fill('input[placeholder="Email"]', emailB);
  await page.fill('input[placeholder="Password"]', PASSWORD);
  await page.click('text=Sign Up');

  await page.goto(`${viewHref}/planning/live`);
  await page.getByRole('button', { name: /(Live AI|AI planning)/ }).click();
  await expect(page.locator('text=hi')).toBeVisible();
  await expect(page.locator('input[placeholder="Type your answer..."]')).toHaveCount(0);
});

test('historical snapshot shows only past chat messages', async ({ page }) => {
  const handle = unique('snap');
  const email = `${handle}@example.com`;
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Snapper');
  await page.fill('input[placeholder="Handle"]', handle);
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Password"]', PASSWORD);
  await page.click('text=Sign Up');

  await page.goto('/planning/live');
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  await page.evaluate(async ({ today }) => {
    await fetch('/api/planning/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: today,
        mode: 'live',
        chatId: 'abc',
        messages: [
          {
            role: 'assistant',
            content: 'hello',
            createdAt: `${today}T00:00:00.000Z`,
          },
          {
            role: 'user',
            content: 'old',
            createdAt: `${today}T01:00:00.000Z`,
          },
        ],
      }),
    });
  }, { today });
  const user = await getUserByHandle(handle);
  await createProfileSnapshot(user.id, today);
  await page.evaluate(async ({ today, tomorrow }) => {
    await fetch('/api/planning/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: today,
        mode: 'live',
        chatId: 'abc',
        messages: [
          {
            role: 'assistant',
            content: 'hello',
            createdAt: `${today}T00:00:00.000Z`,
          },
          {
            role: 'user',
            content: 'old',
            createdAt: `${today}T01:00:00.000Z`,
          },
          {
            role: 'user',
            content: 'new',
            createdAt: `${tomorrow}T00:00:00.000Z`,
          },
        ],
      }),
    });
  }, { today, tomorrow });

  await page.goto(`/history/self/${today}/planning/live`);
  await page.getByRole('button', { name: /(Live AI|AI planning)/ }).click();
  await expect(page.locator('text=old')).toBeVisible();
  await expect(page.locator('text=new')).toHaveCount(0);
  await expect(page.locator('input[placeholder="Type your answer..."]')).toHaveCount(0);
});

