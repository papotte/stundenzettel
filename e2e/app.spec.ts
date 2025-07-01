
import { test, expect, type Page } from '@playwright/test';

// Helper function to create a new manual entry
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

test.describe('TimeWise App E2E Tests', () => {

  // --- SETUP: Run before all tests ---
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

  // --- AUTHENTICATION & BASIC NAVIGATION ---
  test('should log in and display the main tracker page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Live Time Tracking' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Tracking' })).toBeVisible();
    await expect(page.getByRole('heading', { name: "Today's Entries" })).toBeVisible();
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

  // --- DAILY ACTIONS ---
  test.describe('Daily Actions & Special Entries', () => {
    test('should add a Sick Leave entry', async ({ page }) => {
      await page.getByRole('button', { name: 'Sick Leave' }).click();
      const toast = page.locator('div:has-text("Entry Added")');
      await expect(toast).toBeVisible();
      
      const sickCard = page.locator('div:has-text("Sick Leave")');
      await expect(sickCard).toBeVisible();
      // Default work hours for mock user 1 is 7 hours
      await expect(sickCard.getByText('07:00:00')).toBeVisible();
    });

    test('should prevent adding a duplicate special entry', async ({ page }) => {
      await page.getByRole('button', { name: 'PTO' }).click();
      await expect(page.locator('div:has-text("Entry for \\"PTO\\" created.")')).toBeVisible();

      // Try to add it again
      await page.getByRole('button', { name: 'PTO' }).click();
      await expect(page.locator('div:has-text("An entry for \\"PTO\\" on this day already exists.")')).toBeVisible();
    });
  });

  // --- SETTINGS ---
  test.describe('Settings Page', () => {
    test('should update settings and reflect changes', async ({ page }) => {
      // Navigate to settings
      await page.getByRole('link', { name: 'Settings' }).click();
      await page.waitForURL('/settings');

      // Change default work hours from 7 to 8.5
      await page.getByLabel('Default daily work hours').fill('8.5');
      await page.getByRole('button', { name: 'Save Settings' }).click();
      await expect(page.locator('div:has-text("Settings Saved")')).toBeVisible();

      // Go back and add a PTO day
      await page.getByRole('link', { name: 'Back to Tracker' }).click();
      await page.waitForURL('/');
      await page.getByRole('button', { name: 'PTO' }).click();

      // Verify the new PTO entry uses the updated 8.5 hours
      const ptoCard = page.locator('div:has-text("PTO")');
      await expect(ptoCard).toBeVisible();
      await expect(ptoCard.getByText('08:30:00')).toBeVisible();
    });
  });
  
  // --- EXPORT ---
  test.describe('Export Page', () => {
    test('should display entries on the export preview', async ({ page }) => {
      // Add an entry to make sure the export page has data
      await addManualEntry(page, 'Export Test Entry', '10:00', '14:00');
      
      // Navigate to export page
      await page.getByRole('link', { name: 'Preview & Export' }).click();
      await page.waitForURL('/export');

      // Check for the entry in the preview table
      const preview = page.locator('.printable-area');
      await expect(preview).toBeVisible();
      await expect(preview.getByText('Export Test Entry')).toBeVisible();
      await expect(preview.getByText('10:00')).toBeVisible();
      await expect(preview.getByText('14:00')).toBeVisible();
      // 4 hours = 4.00
      await expect(preview.getByText('4.00')).toBeVisible();

      // Navigate months
      const currentMonth = await page.locator('h2').textContent();
      await page.getByRole('button', { name: 'ChevronRight' }).click();
      const nextMonth = await page.locator('h2').textContent();
      expect(currentMonth).not.toEqual(nextMonth);
    });
  });
});
