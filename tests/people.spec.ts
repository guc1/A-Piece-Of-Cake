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

test('following an open account shows inbox notification', async ({ page, browser }) => {
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
  const row = page.locator(`li:has-text("@${handle2}")`);
  await row.getByRole('button', { name: 'Follow' }).click();
  await expect(row.getByRole('button', { name: 'Unfollow' })).toBeVisible();

  await page.goto('/people/inbox');
  await expect(
    page.getByText(`@${handle2} accepted your follow request`),
  ).toBeVisible();
});

test('followed user remains visible to allow follow-back', async ({ page, browser }) => {
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

  await page.goto('/people');
  const row = page.locator(`li:has-text("@${handle2}")`);
  await row.getByRole('button', { name: 'Follow' }).click();
  await expect(row.getByRole('button', { name: 'Unfollow' })).toBeVisible();

  await page2.goto('/people');
  await expect(page2.getByText(`@${handle1}`)).toBeVisible();
  await expect(
    page2.locator(`li:has-text("@${handle1}")`).getByRole('button', {
      name: 'Follow',
    }),
  ).toBeVisible();
  await ctx2.close();
});
