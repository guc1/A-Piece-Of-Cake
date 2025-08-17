import { test, expect } from '@playwright/test';

test('people page lists other users', async ({ page, browser }) => {
  const ts = Date.now();
  const handle1 = `user${ts}`;
  const email1 = `${handle1}@example.com`;
  const password = 'pass1234';

  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'User One');
  await page.fill('input[placeholder="Handle"]', handle1);
  await page.fill('input[placeholder="Email"]', email1);
  await page.fill('input[placeholder="Password"]', password);
  await page.click('text=Sign Up');
  await page.waitForURL('**/flavors');

  const handle2 = `user${ts + 1}`;
  const email2 = `${handle2}@example.com`;
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  await page2.goto('/signup');
  await page2.fill('input[placeholder="Name"]', 'User Two');
  await page2.fill('input[placeholder="Handle"]', handle2);
  await page2.fill('input[placeholder="Email"]', email2);
  await page2.fill('input[placeholder="Password"]', password);
  await page2.click('text=Sign Up');
  await page2.waitForURL('**/flavors');
  await ctx2.close();

  await page.goto('/people');
  await expect(page.getByText(`@${handle2}`)).toBeVisible();
});

test('following someone sends inbox notification', async ({
  page,
  browser,
}) => {
  const ts = Date.now();
  const h1 = `follower${ts}`;
  const e1 = `${h1}@example.com`;
  const h2 = `target${ts + 1}`;
  const e2 = `${h2}@example.com`;
  const password = 'pass1234';

  // Sign up follower
  await page.goto('/signup');
  await page.fill('input[placeholder="Name"]', 'Follower');
  await page.fill('input[placeholder="Handle"]', h1);
  await page.fill('input[placeholder="Email"]', e1);
  await page.fill('input[placeholder="Password"]', password);
  await page.click('text=Sign Up');
  await page.waitForURL('**/flavors');

  // Sign up target in separate context
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  await page2.goto('/signup');
  await page2.fill('input[placeholder="Name"]', 'Target');
  await page2.fill('input[placeholder="Handle"]', h2);
  await page2.fill('input[placeholder="Email"]', e2);
  await page2.fill('input[placeholder="Password"]', password);
  await page2.click('text=Sign Up');
  await page2.waitForURL('**/flavors');

  // follower follows target
  await page.goto('/people');
  const item = page.locator(`li:has-text("@${h2}")`);
  await item.getByRole('button').click();
  await page.waitForLoadState('networkidle');

  // target sees notification
  await page2.goto('/people/inbox');
  await expect(page2.getByText(`@${h1} started following you`)).toBeVisible();
  await ctx2.close();
});
