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

      // Manually set start and end times to be at least 1 minute apart
      await form.getByLabel('Startzeit').fill('09:00');
      await form.getByLabel('Endzeit').fill('09:01');

      // Save the entry
      await form.getByRole('button', { name: 'Eintrag speichern' }).click();
      await expect(form).not.toBeVisible();

      // Verify the new entry is on the page
      const newEntryCard = page.locator(`[data-location="${location}"]`);
      await expect(newEntryCard).toBeVisible();
    });

    test('should show a toast if starting timer without a location', async ({ page }) => {
      await page.getByRole('button', { name: 'Erfassung starten' }).click();
      await expect(page.locator('[data-testid="toast-title"]')).toContainText('Standort erforderlich');
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
      const location = 'Manual Location';
      await addManualEntry(page, location, '09:00', '11:00');
      const entryCard = page.locator(`[data-location="${location}"]`);
      await expect(entryCard).toBeVisible();
      await expect(entryCard.getByText(/9:00.*-.*11:00/)).toBeVisible();
      await expect(entryCard.getByText('02:00:00')).toBeVisible();

      // Edit
      await entryCard.getByRole('button', { name: 'Bearbeiten' }).click();
      const form = page.locator('div[role="dialog"]:has(h2:has-text("Zeiteintrag bearbeiten"))');
      await expect(form).toBeVisible();
      await form.getByLabel('Einsatzort').fill('Edited Manual Location');
      await form.getByLabel('Endzeit').fill('11:30');
      await form.getByRole('button', { name: 'Eintrag speichern' }).click();

      const newLocation = 'Edited Manual Location';
      const editedCard = page.locator(`[data-location="${newLocation}"]`);
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
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      // Check if the date in the button contains yesterday's day of the month.
      // This is more robust than checking a full, locale-sensitive string.
      const yesterdayIso = yesterday.toISOString().slice(0, 10);
      const dateDisplay = page.locator(`[data-selected-date="${yesterdayIso}"]`);
      await expect(dateDisplay).toBeVisible();
      // Add entry for yesterday
      const location = 'Work From Yesterday';
      await addManualEntry(page, location, "13:00", "14:00");
      await expect(page.locator(`[data-location="${location}"]`)).toBeVisible();

      // Navigate back to today
      await page.getByRole('button', { name: 'Next day' }).click();

      // Verify yesterday's entry is not visible
      await expect(page.locator(`[data-location="${location}"]`)).not.toBeVisible();
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
      await expect(form.getByText('End time must be after start time')).toBeVisible();
    });

    test('should show validation error for missing required fields', async ({ page }) => {
      await page.getByRole('button', { name: 'Hinzufügen' }).click();
      const form = page.locator('div[role="dialog"]:has(h2:has-text("Zeiteintrag hinzufügen"))');
      await expect(form).toBeVisible();
      // Leave location empty
      await form.getByLabel('Startzeit').fill('09:00');
      await form.getByLabel('Endzeit').fill('11:00');
      await form.getByRole('button', { name: 'Eintrag speichern' }).click();
      await expect(form.getByText('Location must be at least 2 characters.')).toBeVisible();
    });

    test('should show pause suggestion for 6h and 9h activity and allow applying it', async ({ page }) => {
      await page.getByRole('button', { name: 'Hinzufügen' }).click();
      const form = page.locator('div[role="dialog"]:has(h2:has-text("Zeiteintrag hinzufügen"))');
      await expect(form).toBeVisible();
      await form.getByLabel('Einsatzort').fill('Long Day');
      await form.getByLabel('Startzeit').fill('08:00');
      await form.getByLabel('Endzeit').fill('14:00'); // 6h
      // Should suggest 30 min pause
      await expect(form.getByText(/Vorschlag: 30 Min/)).toBeVisible();
      // Click the suggestion
      await form.getByRole('button', { name: /Vorschlag: 30 Min/ }).click();
      await expect(form.getByLabel('Pause')).toHaveValue('00:30');
      // Now test for 9h suggestion
      await form.getByLabel('Endzeit').fill('17:00'); // 9h
      await expect(form.getByText(/Vorschlag: 45 Min/)).toBeVisible();
      await form.getByRole('button', { name: /Vorschlag: 45 Min/ }).click();
      await expect(form.getByLabel('Pause')).toHaveValue('00:45');
    });

    test('should correctly calculate total worked time with pause and travel', async ({ page }) => {
      await page.getByRole('button', { name: 'Hinzufügen' }).click();
      const form = page.locator('div[role="dialog"]:has(h2:has-text("Zeiteintrag hinzufügen"))');
      await expect(form).toBeVisible();
      await form.getByLabel('Einsatzort').fill('Calc Test');
      await form.getByLabel('Startzeit').fill('08:00');
      await form.getByLabel('Endzeit').fill('12:00'); // 4h
      await form.getByLabel('Pause').fill('00:30'); // 30 min pause
      await form.getByLabel('Fahrtzeit (Stunden)').fill('1.5'); // 1.5h travel
      // Should show total compensated time: 4h - 0.5h + 1.5h = 5h
      await expect(form.getByText('Vergütete Gesamtzeit:')).toBeVisible();
      await expect(form.getByText('5h 0m')).toBeVisible();
      // Save and check card
      await form.getByRole('button', { name: 'Eintrag speichern' }).click();
      const entryCard = page.locator('[data-location="Calc Test"]');
      await expect(entryCard).toBeVisible();
      await expect(entryCard.getByText('05:00:00')).toBeVisible();
    });

    test('should allow entry starting and/or ending at midnight', async ({ page }) => {
      await page.getByRole('button', { name: 'Hinzufügen' }).click();
      const form = page.locator('div[role="dialog"]:has(h2:has-text("Zeiteintrag hinzufügen"))');
      await expect(form).toBeVisible();
      await form.getByLabel('Einsatzort').fill('Midnight Start');
      await form.getByLabel('Startzeit').fill('00:00');
      await form.getByLabel('Endzeit').fill('01:00');
      await form.getByRole('button', { name: 'Eintrag speichern' }).click();
      const entryCard = page.locator('[data-location="Midnight Start"]');
      await expect(entryCard).toBeVisible();
      await expect(entryCard.getByText('01:00:00')).toBeVisible();
    });

    test('should not allow entry spanning midnight (end before start)', async ({ page }) => {
      await page.getByRole('button', { name: 'Hinzufügen' }).click();
      const form = page.locator('div[role="dialog"]:has(h2:has-text("Zeiteintrag hinzufügen"))');
      await expect(form).toBeVisible();
      await form.getByLabel('Einsatzort').fill('Spanning Midnight');
      await form.getByLabel('Startzeit').fill('23:00');
      await form.getByLabel('Endzeit').fill('01:00');
      await form.getByRole('button', { name: 'Eintrag speichern' }).click();
      await expect(form.getByText('End time must be after start time')).toBeVisible();
    });

    test('should allow entry with maximum allowed duration (10 hours)', async ({ page }) => {
      await page.getByRole('button', { name: 'Hinzufügen' }).click();
      const form = page.locator('div[role="dialog"]:has(h2:has-text("Zeiteintrag hinzufügen"))');
      await expect(form).toBeVisible();
      await form.getByLabel('Einsatzort').fill('Max Duration');
      await form.getByLabel('Startzeit').fill('08:00');
      await form.getByLabel('Endzeit').fill('18:00');
      await form.getByRole('button', { name: 'Eintrag speichern' }).click();
      const entryCard = page.locator('[data-location="Max Duration"]');
      await expect(entryCard).toBeVisible();
      await expect(entryCard.getByText('10:00:00')).toBeVisible();
    });

    test('should not allow entry with duration greater than 10 hours', async ({ page }) => {
      await page.getByRole('button', { name: 'Hinzufügen' }).click();
      const form = page.locator('div[role="dialog"]:has(h2:has-text("Zeiteintrag hinzufügen"))');
      await expect(form).toBeVisible();
      await form.getByLabel('Einsatzort').fill('Too Long');
      await form.getByLabel('Startzeit').fill('08:00');
      await form.getByLabel('Endzeit').fill('19:00');
      // Should show a validation error (if enforced by your app)
      await expect(form.getByText(/Warnung/i)).toBeVisible();
      await form.getByRole('button', { name: 'Eintrag speichern' }).click();
    });
  });

  // --- DAILY ACTIONS & SPECIAL ENTRIES ---
  test.describe('Daily Actions & Special Entries', () => {
    test('should add, edit, and delete a Sick Leave entry', async ({ page }) => {
      const sickLeaveButtonText = 'Krankschreibung';

      // Add
      await page.getByRole('button', { name: sickLeaveButtonText }).click();
      const sickCard = page.locator(`[data-testid="time-entry-card-sick_leave"]`);
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

    test('should correctly calculate total for special entries (Urlaub, Feiertag, Stundenabbau)', async ({ page }) => {
      // Urlaub (PTO)
      await page.getByRole('button', { name: 'Urlaub' }).click();
      const ptoCard = page.locator('[data-testid="time-entry-card-pto"]');
      await expect(ptoCard).toBeVisible();
      await expect(ptoCard.getByText('07:00:00')).toBeVisible();

      // Feiertag (Bank Holiday)
      await page.getByRole('button', { name: 'Feiertag' }).click();
      const holidayCard = page.locator('[data-testid="time-entry-card-bank_holiday"]');
      await expect(holidayCard).toBeVisible();
      await expect(holidayCard.getByText('07:00:00')).toBeVisible();

      // Stundenabbau (Time Off in Lieu)
      await page.getByRole('button', { name: 'Stundenabbau' }).click();
      const toilCard = page.locator('[data-testid="time-entry-card-time_off_in_lieu"]');
      await expect(toilCard).toBeVisible();
      await expect(toilCard.getByText('—')).toBeVisible();
    });
    
    test('should prevent adding a duplicate special entry', async ({ page }) => {
      const ptoButtonText = 'Urlaub';
      const entryAddedToastText = 'Eintrag hinzugefügt';
      const entryExistsToastText = 'Ein Eintrag für "Urlaub" an diesem Tag existiert bereits.';

      await page.getByRole('button', { name: ptoButtonText }).click();
      const entryAddedToast = page.locator(`[data-testid="toast-title"]`);
      await expect(entryAddedToast).toContainText(entryAddedToastText);

      // Try to add it again
      await page.getByRole('button', { name: ptoButtonText }).click();
      const entryErrorToastDescription = page.locator(`[data-testid="toast-description"]`);
      await expect(entryErrorToastDescription).toContainText(entryExistsToastText);
    });

    test('should correctly sum hours from multiple entry types in daily summary', async ({ page }) => {
      // Manual entry: 2 hours
      await addManualEntry(page, 'Morning Work', '09:00', '11:00');

      // Special entry: 7 hours (default for mock user 1), which is "Krankschreibung"
      await page.getByRole('button', { name: 'Krankschreibung' }).click();

      // The summary total should be 2 + 7 = 9 hours.
      const summaryCard = page.locator('[data-testid="summary-card"]');
      const dailyTotal = summaryCard.locator('p:has-text("Ausgewählter Tag") + p');
      await expect(dailyTotal).toHaveText('9h 0m');
    });
  });
});
