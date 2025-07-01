
import { test, expect, type Page } from '@playwright/test';
import { addManualEntry } from './test-helpers';

test.describe('Core Tracker Functionality', () => {

  // --- SETUP: Run before each test in this file ---
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and log in as the first mock user (language is German)
    await page.goto('/');
    await page.getByRole('button', { name: /Log in as/ }).first().click();
    await page.waitForURL('/');
  });

  // --- LIVE TIME TRACKING ---
  test.describe('Live Time Tracking', () => {
    test('should start and stop the timer, then save the entry', async ({ page }) => {
      const location = 'Live Test Location';
      await page.getByPlaceholder('Wo arbeiten Sie gerade?').fill(location);
      await page.getByRole('button', { name: 'Erfassung starten' }).click();
      
      // Check if timer is running
      await expect(page.getByText(`Ort: ${location}`)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Stopp' })).toBeVisible();
      // Wait for a second for the timer to tick
      await page.waitForTimeout(1100); 
      await expect(page.locator('.font-mono')).not.toHaveText('00:00:00');

      // Stop the timer
      await page.getByRole('button', { name: 'Stopp' }).click();
      
      // The form should open automatically
      const form = page.locator('div[role="dialog"]:has(h2:has-text("Zeiteintrag bearbeiten"))');
      await expect(form).toBeVisible();
      await expect(form.getByLabel('Einsatzort')).toHaveValue(location);

      // Save the entry
      await form.getByRole('button', { name: 'Eintrag speichern' }).click();
      await expect(form).not.toBeVisible();

      // Verify the new entry is on the page
      const newEntryCard = page.locator(`div:has-text("${location}")`);
      await expect(newEntryCard).toBeVisible();
    });

    test('should show a toast if starting timer without a location', async ({ page }) => {
      await page.getByRole('button', { name: 'Erfassung starten' }).click();
      await expect(page.locator('div:has-text("Standort erforderlich")')).toBeVisible();
    });

    test('should discard a live entry if the form is cancelled', async ({ page }) => {
      await page.getByPlaceholder('Wo arbeiten Sie gerade?').fill('Temporary Work');
      await page.getByRole('button', { name: 'Erfassung starten' }).click();
      await page.getByRole('button', { name: 'Stopp' }).click();
      
      const form = page.locator('div[role="dialog"]:has(h2:has-text("Zeiteintrag bearbeiten"))');
      await expect(form).toBeVisible();
      
      // Cancel instead of saving
      await form.getByRole('button', { name: 'Abbrechen' }).click();
      await expect(form).not.toBeVisible();

      // Verify no entry was created
      await expect(page.getByText('Keine Einträge für diesen Tag.')).toBeVisible();
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
      await expect(entryCard.getByText(/09:00.*-.*11:00/)).toBeVisible();
      await expect(entryCard.getByText('02:00:00')).toBeVisible();

      // Edit
      await entryCard.getByRole('button', { name: 'Bearbeiten' }).click();
      const form = page.locator('div[role="dialog"]:has(h2:has-text("Zeiteintrag bearbeiten"))');
      await expect(form).toBeVisible();
      await form.getByLabel('Einsatzort').fill('Edited Manual Location');
      await form.getByLabel('Endzeit').fill('11:30');
      await form.getByRole('button', { name: 'Eintrag speichern' }).click();
      
      const editedCard = page.locator('div:has-text("Edited Manual Location")');
      await expect(editedCard).toBeVisible();
      await expect(editedCard.getByText('02:30:00')).toBeVisible();

      // Delete
      await editedCard.getByRole('button', { name: 'Löschen' }).click();
      await page.getByRole('button', { name: 'Löschen', exact: true }).click();
      await expect(editedCard).not.toBeVisible();
      await expect(page.getByText('Keine Einträge für diesen Tag.')).toBeVisible();
    });

    test('should add an entry for a different day using date navigation', async ({ page }) => {
      // Navigate to yesterday
      await page.getByRole('button', { name: 'Previous day' }).click();
      const dateDisplay = page.getByRole('button', { name: /Calendar/ });
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      // Check if the date in the button contains yesterday's day of the month.
      // This is more robust than checking a full, locale-sensitive string.
      await expect(dateDisplay).toContainText(String(yesterday.getDate()));

      // Add entry for yesterday
      await addManualEntry(page, "Work From Yesterday", "13:00", "14:00");
      await expect(page.locator('div:has-text("Work From Yesterday")')).toBeVisible();

      // Navigate back to today
      await page.getByRole('button', { name: 'Next day' }).click();
      
      // Verify yesterday's entry is not visible
      await expect(page.locator('div:has-text("Work From Yesterday")')).not.toBeVisible();
      await expect(page.getByText('Keine Einträge für diesen Tag.')).toBeVisible();
    });

    test('should show validation error for invalid time range', async ({ page }) => {
      await page.getByRole('button', { name: 'Hinzufügen' }).click();
      const form = page.locator('div[role="dialog"]:has(h2:has-text("Zeiteintrag hinzufügen"))');
      await expect(form).toBeVisible();
      await form.getByLabel('Einsatzort').fill('Invalid Time');
      await form.getByLabel('Startzeit').fill('14:00');
      await form.getByLabel('Endzeit').fill('13:00');
      await form.getByRole('button', { name: 'Eintrag speichern' }).click();

      // Error message should be visible. Note: this message from Zod is not translated.
      await expect(form.getByText('End time must be after start time')).toBeVisible();
    });
  });

  // --- DAILY ACTIONS & SPECIAL ENTRIES ---
  test.describe('Daily Actions & Special Entries', () => {
    test('should add, edit, and delete a Sick Leave entry', async ({ page }) => {
      const sickLeaveButtonText = 'Krankschreibung';
      
      // Add
      await page.getByRole('button', { name: sickLeaveButtonText }).click();
      const sickCard = page.locator(`div:has-text("${sickLeaveButtonText}")`);
      await expect(sickCard).toBeVisible();
      // Default work hours for mock user 1 is 7 hours
      await expect(sickCard.getByText('07:00:00')).toBeVisible();
      
      // Edit
      await sickCard.getByRole('button', { name: 'Bearbeiten' }).click();
      const form = page.locator('div[role="dialog"]:has(h2:has-text("Zeiteintrag bearbeiten"))');
      await expect(form).toBeVisible();
      // A special entry's start/end times can be changed.
      await form.getByLabel('Startzeit').fill('10:00'); // Originally 09:00 - 16:00 (7h)
      await form.getByRole('button', { name: 'Eintrag speichern' }).click();
      await expect(sickCard.getByText('06:00:00')).toBeVisible(); // Now 10:00 - 16:00 (6h)

      // Delete
      await sickCard.getByRole('button', { name: 'Löschen' }).click();
      await page.getByRole('button', { name: 'Löschen' }).click();
      await expect(sickCard).not.toBeVisible();
    });

    test('should prevent adding a duplicate special entry', async ({ page }) => {
      const ptoButtonText = 'Urlaub';
      const entryAddedToastText = 'Eintrag hinzugefügt';
      const entryExistsToastText = 'Ein Eintrag für "Urlaub" an diesem Tag existiert bereits.';

      await page.getByRole('button', { name: ptoButtonText }).click();
      await expect(page.locator(`div:has-text("${entryAddedToastText}")`)).toBeVisible();

      // Try to add it again
      await page.getByRole('button', { name: ptoButtonText }).click();
      await expect(page.locator(`div:has-text("${entryExistsToastText}")`)).toBeVisible();
    });

    test('should correctly sum hours from multiple entry types in daily summary', async ({ page }) => {
      // Manual entry: 2 hours
      await addManualEntry(page, 'Morning Work', '09:00', '11:00');

      // Special entry: 7 hours (default for mock user 1), which is "Krankschreibung"
      await page.getByRole('button', { name: 'Krankschreibung' }).click();
      
      // The summary total should be 2 + 7 = 9 hours.
      const summaryCard = page.locator('div.card:has-text("Stundenübersicht")');
      const dailyTotal = summaryCard.locator('div:has-text("Ausgewählter Tag") + p');
      await expect(dailyTotal).toHaveText('9h 0m');
    });
  });
});
