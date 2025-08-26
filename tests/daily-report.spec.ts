import { test, expect, type Page } from '@playwright/test';

const PASSWORD = 'pass1234';

function unique(prefix: string) {
  return `${prefix}${Date.now()}${Math.random()}`;
}

async function signup(page: Page) {
  const handle = unique('rep');
  const email = `${handle}@example.com`;
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Tester');
  await page.fill('input[placeholder="Handle"]', handle);
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Password"]', PASSWORD);
  await page.click('text=Sign Up');
}

test('stores valid daily report and lists it', async ({ page }) => {
  await signup(page);
  const res = await page.request.post('/api/progress/daily-report', {
    data: {
      date: '2025-09-21',
      plan: { blocks: [], dailyAim: '', dailyIngredientIds: [] },
      reviews: {},
      report: {
        summary: 'ok',
        good: ['g'],
        bad: [],
        observations: [],
        score: 83,
      },
    },
  });
  expect(res.status()).toBe(200);
  await page.goto('/progress/overview/daily');
  await expect(page.getByRole('link', { name: /2025-09-21/ })).toBeVisible();
  await expect(page.getByText('83')).toBeVisible();
});

test('rejects duplicated payload', async ({ page }) => {
  await signup(page);
  const res = await page.request.post('/api/progress/daily-report', {
    data: {
      date: '2025-09-22',
      plan: { blocks: [], dailyAim: '', dailyIngredientIds: [] },
      reviews: {},
      report:
        JSON.stringify({
          summary: 'ok',
          good: [],
          bad: [],
          observations: [],
          score: 83,
        }) + ',83',
    },
  });
  expect(res.status()).toBe(400);
});

test('rejects missing score', async ({ page }) => {
  await signup(page);
  const res = await page.request.post('/api/progress/daily-report', {
    data: {
      date: '2025-09-23',
      plan: { blocks: [], dailyAim: '', dailyIngredientIds: [] },
      reviews: {},
      report: {
        summary: 'ok',
        good: [],
        bad: [],
        observations: [],
      },
    },
  });
  expect(res.status()).toBe(400);
});

test('db error hides details', async ({ page }) => {
  await signup(page);
  const res = await page.request.post('/api/progress/daily-report', {
    data: {
      date: '2025-99-99',
      plan: { blocks: [], dailyAim: '', dailyIngredientIds: [] },
      reviews: {},
      report: {
        summary: 'ok',
        good: [],
        bad: [],
        observations: [],
        score: 80,
      },
    },
  });
  expect(res.status()).toBe(500);
  const body = await res.json();
  expect(body.error).toBe('Failed to save daily report');
});
