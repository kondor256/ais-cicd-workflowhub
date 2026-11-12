
import { test, expect, type Page } from '@playwright/test';

const password = 'PlaywrightTest2026!';

async function registerAndLogin(page: Page, username: string) {
  await page.goto('/register');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Email').fill(`${username}@example.test`);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page).toHaveURL(/\/login\/?$/);

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page).toHaveURL(/\/workflows\/?$/);
}

test('user B cannot see user A workflow item', async ({ browser }) => {
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const userA = `e2e-${runId}-a`;
  const userB = `e2e-${runId}-b`;
  const privateTitle = `e2e-${runId}-private-item`;

  // Separate browser contexts keep the two sessions isolated.
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  const itemA = pageA.locator('ul.item-list > li').filter({
    has: pageA.getByRole('heading', {
      name: privateTitle,
      exact: true,
    }),
  });

  try {
    // STEP 1: Register and log in as user A.
    await registerAndLogin(pageA, userA);

    // STEP 2: User A creates a workflow item.
    await pageA.getByLabel('Title').fill(privateTitle);
    await pageA.getByLabel('Description')
      .fill('This item belongs only to user A.');

    await pageA.getByRole('button', { name: 'Add item' }).click();

    await expect(itemA).toBeVisible();

    // STEP 3: Register and log in separately as user B.
    await registerAndLogin(pageB, userB);

    // STEP 4: Check user B's workflow page.
    const itemB = pageB.locator('ul.item-list > li').filter({
      has: pageB.getByRole('heading', {
        name: privateTitle,
        exact: true,
      }),
    });

    await expect(itemB).toHaveCount(0);

    // STEP 5: Verify that B's workflow LIST API
    // does not return user A's item.
    const responsePromise = pageB.waitForResponse(
      (response) =>
        response.url().includes('/api/workflows/items/') &&
        response.request().method() === 'GET'
    );

    await pageB.reload();

    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();

    const items = await response.json();
    expect(Array.isArray(items)).toBe(true);

    const exposed = items.some(
      (item: { title: string }) => item.title === privateTitle
    );

    expect(exposed).toBe(false);
    await expect(itemB).toHaveCount(0);

    // User A should still be able to see their own item.
    await expect(itemA).toBeVisible();

  } finally {
    // Clean up user A's item, even if the test fails.
    try {
      await pageA.goto('/workflows');

      if (await itemA.isVisible()) {
        await itemA.getByRole('button', { name: 'Delete' }).click();

        await itemA.getByRole('alertdialog', {
          name: 'Confirm delete',
        }).getByRole('button', { name: 'Confirm' }).click();

        await expect(itemA).toHaveCount(0);
      }
    } finally {
      await contextA.close();
      await contextB.close();
    }
  }
});
