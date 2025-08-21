import { test, expect } from '@playwright/test';
import { getUserByHandle } from '@/lib/users';
import { savePlan, getPlanAt } from '@/lib/plans-store';
import { createProfileSnapshot, getProfileSnapshot } from '@/lib/profile-snapshots';

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

test('historical plans keep past versions', async ({ page }) => {
  const handle = unique('planner');
  const email = `${handle}@example.com`;
  const todayStr = today();
  const future = addDays(todayStr, 8);

  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Planner');
  await page.fill('input[placeholder="Handle"]', handle);
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Password"]', PASSWORD);
  await page.click('text=Sign Up');

  const user = await getUserByHandle(handle);
  const blocksA = [
    {
      start: iso(future, 9),
      end: iso(future, 10),
      title: 'Old',
      description: '',
      color: '#F87171',
    },
  ];
  await savePlan(String(user.id), future, blocksA);
  await createProfileSnapshot(user.id, todayStr);
  const snap = await getProfileSnapshot(user.id, todayStr);
  if (!snap) throw new Error('missing snapshot');
  await new Promise((r) => setTimeout(r, 1000));
  const blocksB = [
    {
      start: iso(future, 9),
      end: iso(future, 10),
      title: 'New',
      description: '',
      color: '#34D399',
    },
  ];
  await savePlan(String(user.id), future, blocksB);

  const plan = await getPlanAt(user.id, future, snap.createdAt);
  expect(plan.blocks[0]?.title).toBe('Old');
});

test('plans added after snapshot are hidden from past snapshots', async ({
  page,
}) => {
  const handle = unique('planner2');
  const email = `${handle}@example.com`;
  const todayStr = today();
  const future = addDays(todayStr, 5);

  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Planner Two');
  await page.fill('input[placeholder="Handle"]', handle);
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Password"]', PASSWORD);
  await page.click('text=Sign Up');

  const user = await getUserByHandle(handle);
  const snapTime = new Date();
  await createProfileSnapshot(user.id, todayStr);

  const blocks = [
    {
      start: iso(future, 9),
      end: iso(future, 10),
      title: 'Future',
      description: '',
      color: '#FBBF24',
    },
  ];
  await savePlan(String(user.id), future, blocks);

  const plan = await getPlanAt(user.id, future, snapTime);
  expect(plan.blocks).toHaveLength(0);
});
