
import { test, expect, type Page } from '@playwright/test';

// Helper function to create a new manual entry for the currently selected day
const addManualEntry = async (page: Page, location: string, startTime: string, endTime: string) => {
  await page.getByRole('button', { name: 'Add' }).click();
  const form = page.locator('div[role="dialog"]:has(h2:has-text("Add Time Entry"))');
  await expect(form).toBeVisible();
  await form.getByLabel('Location').fill(location);
  await form.getByLabel('Start time').fill(startTime);
  await form.getByLabel('End time').fill(endTime);
  await form.getByRole('button', { name: 'Save Entry' }).click();
  await expect(form).not.toBeVisible();
};

test.describe('Core Tracker Functionality', () => {

  // --- SETUP: Run before each test in this file ---
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and log in as the first mock user
    await page.goto('/');
    await page.getByRole('button', { name: /Log in as/ }).first().click();
    await page.waitForURL('/');

    // Clear any existing data for a clean test run
    const clearDataButton = page.getByRole('button', { name: 'Clear all data' });
    await clearDataButton.click();
    await page.getByRole('button', { name: 'Yes, delete everything' }).click();
    // Wait for the "Data Cleared" toast to appear and disappear
    await expect(page.locator('div:has-text("Data Cleared")')).toBeVisible();
    await expect(page.locator('div:has-text("Data Cleared")')).not.toBeVisible({ timeout: 10000 });
  });

  // --- LIVE TIME TRACKING ---
  test.describe('Live Time Tracking', () => {
    test('should start and stop the timer, then save the entry', async ({ page }) => {
      const location = 'Live Test Location';
      await page.getByPlaceholder('Where are you working from?').fill(location);
      await page.getByRole('button', { name: 'Start Tracking' }).click();
      
      // Check if timer is running
      await expect(page.getByText(`Location: ${location}`)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
      // Wait for a second for the timer to tick
      await page.waitForTimeout(1100); 
      await expect(page.locator('.font-mono')).not.toHaveText('00:00:00');

      // Stop the timer
      await page.getByRole('button', { name: 'Stop' }).click();
      
      // The form should open automatically
      const form = page.locator('div[role="dialog"]:has(h2:has-text("Edit Time Entry"))');
      await expect(form).toBeVisible();
      await expect(form.getByLabel('Location')).toHaveValue(location);

      // Save the entry
      await form.getByRole('button', { name: 'Save Entry' }).click();
      await expect(form).not.toBeVisible();

      // Verify the new entry is on the page
      const newEntryCard = page.locator(`div:has-text("${location}")`);
      await expect(newEntryCard).toBeVisible();
    });

    test('should show a toast if starting timer without a location', async ({ page }) => {
      await page.getByRole('button', { name: 'Start Tracking' }).click();
      await expect(page.locator('div:has-text("Location required")')).toBeVisible();
    });

    test('should discard a live entry if the form is cancelled', async ({ page }) => {
      await page.getByPlaceholder('Where are you working from?').fill('Temporary Work');
      await page.getByRole('button', { name: 'Start Tracking' }).click();
      await page.getByRole('button', { name: 'Stop' }).click();
      
      const form = page.locator('div[role="dialog"]:has(h2:has-text("Edit Time Entry"))');
      await expect(form).toBeVisible();
      
      // Cancel instead of saving
      await form.getByRole('button', { name: 'Cancel' }).click();
      await expect(form).not.toBeVisible();

      // Verify no entry was created
      await expect(page.getByText('No entries for this day.')).toBeVisible();
      await expect(page.locator('div:has-text("Temporary Work")')).not.toBeVisible();
    });
  });

  // --- MANUAL TIME ENTRIES ---
  test.describe('Manual Time Entries', () => {
    test('should add, edit, and delete a manual entry', async ({ page }) => {
      // Add
      await addManualEntry(page, 'Manual Location', '09:00', '11:00');
      const entryCard = page.locator('div:has-text("Manual Location")');
      await expect(entryCard).toBeVisible();
      await expect(entryCard.getByText(/9:00.*-.*11:00/i)).toBeVisible();
      await expect(entryCard.getByText('02:00:00')).toBeVisible();

      // Edit
      await entryCard.getByRole('button', { name: 'Edit' }).click();
      const form = page.locator('div[role="dialog"]:has(h2:has-text("Edit Time Entry"))');
      await expect(form).toBeVisible();
      await form.getByLabel('Location').fill('Edited Manual Location');
      await form.getByLabel('End time').fill('11:30');
      await form.getByRole('button', { name: 'Save Entry' }).click();
      
      const editedCard = page.locator('div:has-text("Edited Manual Location")');
      await expect(editedCard).toBeVisible();
      await expect(editedCard.getByText('02:30:00')).toBeVisible();

      // Delete
      await editedCard.getByRole('button', { name: 'Delete' }).click();
      await page.getByRole('button', { name: 'Delete', exact: true }).click();
      await expect(editedCard).not.toBeVisible();
      await expect(page.getByText('No entries for this day.')).toBeVisible();
    });

    test('should add an entry for a different day using date navigation', async ({ page }) => {
      // Navigate to yesterday
      await page.getByRole('button', { name: 'Previous day' }).click();
      const dateDisplay = page.getByRole('button', { name: /Calendar/ });
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      // Check if the date in the button matches yesterday's date (e.g., "Mon, Jul 28, 2025")
      await expect(dateDisplay).toContainText(yesterday.toLocaleDateString(undefined, { weekday: 'short' }));

      // Add entry for yesterday
      await addManualEntry(page, "Work From Yesterday", "13:00", "14:00");
      await expect(page.locator('div:has-text("Work From Yesterday")')).toBeVisible();

      // Navigate back to today
      await page.getByRole('button', { name: 'Next day' }).click();
      
      // Verify yesterday's entry is not visible
      await expect(page.locator('div:has-text("Work From Yesterday")')).not.toBeVisible();
      await expect(page.getByText('No entries for this day.')).toBeVisible();
    });

    test('should show validation error for invalid time range', async ({ page }) => {
      await page.getByRole('button', { name: 'Add' }).click();
      const form = page.locator('div[role="dialog"]:has(h2:has-text("Add Time Entry"))');
      await expect(form).toBeVisible();
      await form.getByLabel('Location').fill('Invalid Time');
      await form.getByLabel('Start time').fill('14:00');
      await form.getByLabel('End time').fill('13:00');
      await form.getByRole('button', { name: 'Save Entry' }).click();

      // Error message should be visible
      await expect(form.getByText('End time must be after start time')).toBeVisible();
    });
  });

  // --- DAILY ACTIONS & SPECIAL ENTRIES ---
  test.describe('Daily Actions & Special Entries', () => {
    test('should add, edit, and delete a Sick Leave entry', async ({ page }) => {
      // Add
      await page.getByRole('button', { name: 'Sick Leave' }).click();
      const sickCard = page.locator('div:has-text("Sick Leave")');
      await expect(sickCard).toBeVisible();
      // Default work hours for mock user 1 is 7 hours
      await expect(sickCard.getByText('07:00:00')).toBeVisible();
      
      // Edit
      await sickCard.getByRole('button', { name: 'Edit' }).click();
      const form = page.locator('div[role="dialog"]:has(h2:has-text("Edit Time Entry"))');
      await expect(form).toBeVisible();
      // A special entry's start/end times can be changed.
      await form.getByLabel('Start time').fill('10:00'); // Originally 09:00 - 16:00 (7h)
      await form.getByRole('button', { name: 'Save Entry' }).click();
      await expect(sickCard.getByText('06:00:00')).toBeVisible(); // Now 10:00 - 16:00 (6h)

      // Delete
      await sickCard.getByRole('button', { name: 'Delete' }).click();
      await page.getByRole('button', { name: 'Delete' }).click();
      await expect(sickCard).not.toBeVisible();
    });

    test('should prevent adding a duplicate special entry', async ({ page }) => {
      await page.getByRole('button', { name: 'PTO' }).click();
      await expect(page.locator('div:has-text("Entry Added")')).toBeVisible();

      // Try to add it again
      await page.getByRole('button', { name: 'PTO' }).click();
      await expect(page.locator('div:has-text("An entry for \\"PTO\\" on this day already exists.")')).toBeVisible();
    });

    test('should correctly sum hours from multiple entry types in daily summary', async ({ page }) => {
      // Manual entry: 2 hours
      await addManualEntry(page, 'Morning Work', '09:00', '11:00');

      // Special entry: 7 hours (default for mock user 1)
      await page.getByRole('button', { name: 'Sick Leave' }).click();
      
      // The summary total should be 2 + 7 = 9 hours.
      const summaryCard = page.locator('div.card:has-text("Hours Summary")');
      const dailyTotal = summaryCard.locator('div:has-text("Selected Day") + p');
      await expect(dailyTotal).toHaveText('9h 0m');
    });
  });
});
