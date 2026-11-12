
import { test, expect } from '@playwright/test';

test('register, log out and log back in', async ({ page }) => {
  // Create a unique test user for this run.
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const username = `e2e-${runId}`;
  const email = `${username}@example.test`;
  const password = 'PlaywrightTest2026!';

  // STEP 1: Register a new user.
  await page.goto('/register');

  await expect(
    page.getByRole('heading', { name: 'Register' })
  ).toBeVisible();

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);

  await page.getByRole('button', { name: 'Register' }).click();

  // Registration redirects to the login page.
  await expect(page).toHaveURL(/\/login\/?$/);

  // STEP 2: Log in for the first time.
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page).toHaveURL(/\/workflows\/?$/);
  await expect(
    page.getByRole('button', { name: 'Log out' })
  ).toBeVisible();

  // STEP 3: Log out.
  await page.getByRole('button', { name: 'Log out' }).click();

  await expect(page).toHaveURL(/\/login\/?$/);
  await expect(
    page.getByRole('button', { name: 'Log out' })
  ).not.toBeVisible();

  // STEP 4: Log in again with the same account.
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();

  // STEP 5: Verify that the session works.
  await expect(page).toHaveURL(/\/workflows\/?$/);

  await expect(
    page.getByText(`Hello, ${username}`)
  ).toBeVisible();

  await expect(
    page.getByRole('button', { name: 'Log out' })
  ).toBeVisible();
});
