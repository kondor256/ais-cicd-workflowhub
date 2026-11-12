
import { test, expect, type Page } from '@playwright/test';

test('workflow item lifecycle: create, status, edit and delete', async ({ page }) => {
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const username = `e2e-${runId}`;
  const password = 'PlaywrightTest2026!';

  const title = `e2e-${runId}-workflow`;
  const editedTitle = `e2e-${runId}-updated-workflow`;
  const description = 'Created by Playwright';
  const editedDescription = 'Updated by Playwright';

  // Find a particular item using its unique heading.
  const findItem = (name: string) =>
    page.locator('ul.item-list > li').filter({
      has: page.getByRole('heading', { name, exact: true }),
    });

  // STEP 1: Register a test user.
  await page.goto('/register');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Email').fill(`${username}@example.test`);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page).toHaveURL(/\/login\/?$/);

  // STEP 2: Log in.
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page).toHaveURL(/\/workflows\/?$/);

  let itemCreated = false;

  try {
    // STEP 3: Create a workflow item.
    await page.getByLabel('Title').fill(title);
    await page.getByLabel('Description').fill(description);
    await page.getByRole('button', { name: 'Add item' }).click();

    let item = findItem(title);
    await expect(item).toBeVisible();
    itemCreated = true;

    // STEP 4: Check initial status: Pending.
    await expect(item.getByRole('combobox', { name: 'Status' }))
      .toHaveValue('pending');

    // STEP 5: Change status to In Progress.
    await item.getByRole('combobox', { name: 'Status' })
      .selectOption('in_progress');

    // Reload to verify the status was saved in the backend.
    await page.reload();
    item = findItem(title);

    await expect(item.getByRole('combobox', { name: 'Status' }))
      .toHaveValue('in_progress');

    // STEP 6: Change status to Completed.
    await item.getByRole('combobox', { name: 'Status' })
      .selectOption('completed');

    await page.reload();
    item = findItem(title);

    await expect(item.getByRole('combobox', { name: 'Status' }))
      .toHaveValue('completed');

    // STEP 7: Edit the workflow item.
    await item.getByRole('button', { name: 'Edit' }).click();

    const editForm = page.locator('ul.item-list li form');

    await editForm.getByLabel('Title').fill(editedTitle);
    await editForm.getByLabel('Description').fill(editedDescription);
    await editForm.getByRole('button', { name: 'Save' }).click();

    await expect(findItem(editedTitle)).toBeVisible();
    await expect(findItem(editedTitle)).toContainText(editedDescription);

    // Verify edits were persisted.
    await page.reload();

    const editedItem = findItem(editedTitle);
    await expect(editedItem).toBeVisible();
    await expect(editedItem).toContainText(editedDescription);

    // STEP 8: Delete the workflow item.
    await editedItem.getByRole('button', { name: 'Delete' }).click();

    const confirmation = editedItem.getByRole('alertdialog', {
      name: 'Confirm delete',
    });

    await expect(confirmation).toBeVisible();
    await confirmation.getByRole('button', { name: 'Confirm' }).click();

    await expect(findItem(editedTitle)).toHaveCount(0);
    itemCreated = false;

    // Confirm the deletion persists after reloading.
    await page.reload();
    await expect(findItem(editedTitle)).toHaveCount(0);

  } finally {
    // Best-effort cleanup if an earlier assertion fails.
    // Prevent leftover workflow items on live deployments.
    if (itemCreated) {
      await page.goto('/workflows');

      for (const name of [editedTitle, title]) {
        const item = findItem(name);

        if (await item.isVisible()) {
          await item.getByRole('button', { name: 'Delete' }).click();
          await item.getByRole('alertdialog', {
            name: 'Confirm delete',
          }).getByRole('button', { name: 'Confirm' }).click();

          await expect(item).toHaveCount(0);
        }
      }
    }
  }
});
