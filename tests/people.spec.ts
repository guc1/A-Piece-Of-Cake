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

test('following an open account shows inbox notification', async ({
  page,
  browser,
}) => {
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

test('following a closed account stays visible', async ({ page, browser }) => {
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
  await page2.goto('/settings/account');
  await page2.selectOption('select', 'closed');
  await page2.click('text=Save');
  await ctx2.close();

  await page.goto('/people');
  const row = page.locator(`li:has-text("@${handle2}")`);
  await row.getByRole('button', { name: 'Request to follow' }).click();
  await expect(
    row.getByRole('button', { name: 'Cancel request' }),
  ).toBeVisible();
});

test('accepting a follow request allows follow back', async ({
  page,
  browser,
}) => {
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
  await page2.goto('/settings/account');
  await page2.selectOption('select', 'closed');
  await page2.click('text=Save');

  // user1 requests to follow user2
  await page.goto('/people');
  const row = page.locator(`li:has-text("@${handle2}")`);
  await row.getByRole('button', { name: 'Request to follow' }).click();

  // user2 accepts request
  await page2.goto('/people/inbox');
  await expect(
    page2.getByText(`@${handle1} wants to follow you`),
  ).toBeVisible();
  const req = page2.locator(`li:has-text("@${handle1}")`);
  await req.getByRole('button', { name: 'Accept' }).click();

  // user2 sees follow back option
  await page2.goto('/people');
  const row2 = page2.locator(`li:has-text("@${handle1}")`);
  await expect(row2.getByRole('button', { name: 'Follow back' })).toBeVisible();

  await ctx2.close();
});

test('declining a follow request notifies requester and allows resend', async ({
  page,
  browser,
}) => {
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
  await page2.goto('/settings/account');
  await page2.selectOption('select', 'closed');
  await page2.click('text=Save');

  // user1 requests to follow user2
  await page.goto('/people');
  let row = page.locator(`li:has-text("@${handle2}")`);
  await row.getByRole('button', { name: 'Request to follow' }).click();

  // user2 declines
  await page2.goto('/people/inbox');
  const req = page2.locator(`li:has-text("@${handle1}")`);
  await req.getByRole('button', { name: 'Decline' }).click();

  // requester sees decline notification and can resend
  await page.goto('/people/inbox');
  await expect(
    page.getByText(`@${handle2} declined your follow request`),
  ).toBeVisible();
  await page.goto('/people');
  row = page.locator(`li:has-text("@${handle2}")`);
  await expect(
    row.getByRole('button', { name: 'Request to follow' }),
  ).toBeVisible();

  await ctx2.close();
});

test('unfollowing sends notification', async ({ page, browser }) => {
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
  await row.getByRole('button', { name: 'Unfollow' }).click();

  await page2.goto('/people/inbox');
  await expect(page2.getByText(`@${handle1} unfollowed you`)).toBeVisible();

  await ctx2.close();
});

test('open profile exposes view account page', async ({ page, browser }) => {
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

  await page.goto(`/u/${handle2}`);
  await page.getByRole('link', { name: 'View account' }).click();
  await expect(page.getByText('Flavors')).toBeVisible();
});
