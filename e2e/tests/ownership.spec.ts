
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

  // Separate browser contexts keep the sessions isolated.
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

    // STEP 2: User A creates a private workflow item.
    await pageA.getByLabel('Title').fill(privateTitle);

    await pageA.getByLabel('Description')
      .fill('This item belongs only to user A.');

    await pageA.getByRole('button', { name: 'Add item' }).click();

    await expect(itemA).toBeVisible();

    // STEP 3: Capture the real workflow API request made
    // by user B's frontend after login.
    //
    // Start listening BEFORE logging in so we do not miss
    // the initial workflow-list request.
    const listRequestPromise = pageB.waitForRequest((request) => {
      const url = new URL(request.url());

      return (
        request.method() === 'GET' &&
        url.pathname === '/api/workflows/items/'
      );
    });

    // Register and log in separately as user B.
    await registerAndLogin(pageB, userB);

    // Obtain the actual API URL used by the frontend.
    // This can be localhost:8000, Render, or another
    // configured backend origin.
    const listRequest = await listRequestPromise;

    // STEP 4: Check user B's workflow page.
    const itemB = pageB.locator('ul.item-list > li').filter({
      has: pageB.getByRole('heading', {
        name: privateTitle,
        exact: true,
      }),
    });

    await expect(itemB).toHaveCount(0);

    // STEP 5: Verify user B's workflow LIST API does
    // not expose user A's private item.

    // Retrieve user B's token from their own browser context.
    // Do not print or log the token.
    const tokenB = await pageB.evaluate(
      () => window.localStorage.getItem('workflowhub.token')
    );

    expect(tokenB).toBeTruthy();

    // Reuse the real API origin from the frontend request.
    // Explicitly request the unfiltered first page.
    const apiUrl = new URL(listRequest.url());

    apiUrl.searchParams.delete('status');
    apiUrl.searchParams.set('page', '1');

    // Make a direct authenticated request as user B.
    // APIRequestContext avoids browser navigation races.
    const response = await contextB.request.get(apiUrl.toString(), {
      headers: {
        Authorization: `Token ${tokenB}`,
      },
    });

    // Verify the API responded successfully with JSON.
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');

    // WFH-21: The list is paginated:
    // { count, next, previous, results }.
    const body = await response.json();

    expect(Array.isArray(body.results)).toBe(true);
    expect(typeof body.count).toBe('number');

    // User B is newly registered and has no workflow items.
    // Checking count covers items across all pages.
    expect(body.count).toBe(0);
    expect(body.results).toHaveLength(0);

    // Explicitly verify user A's item is not exposed.
    const exposed = body.results.some(
      (item: { title: string }) => item.title === privateTitle
    );

    expect(exposed).toBe(false);

    // Verify user B cannot see the item in the UI.
    await expect(itemB).toHaveCount(0);

    // STEP 6: User A must still see their own item.
    await expect(itemA).toBeVisible();

  } finally {
    // STEP 7: Clean up user A's item even if the test fails.
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
