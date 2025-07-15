import { expect, test } from '@playwright/test'

import { addManualEntry } from './test-helpers'

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and log in as the first mock user (language is German)
    await page.goto('/login')
    await page
      .getByRole('button', { name: /Log in as/ })
      .first()
      .click()
    await page.waitForURL('/tracker')
  })

  test('should update settings and reflect changes', async ({ page }) => {
    // Navigate to settings
    await page.getByRole('link', { name: 'Einstellungen' }).click()
    await page.waitForURL('/settings')

    // Change default work hours from 7 to 8.5
    await page.getByLabel('Tägliche Standardarbeitszeit').fill('8.5')
    await page.getByRole('button', { name: 'Einstellungen speichern' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Einstellungen gespeichert',
    )

    // Go back and add a PTO day
    await page.getByRole('link', { name: 'Zurück zur Übersicht' }).click()
    await page.waitForURL('/tracker')

    await page.getByRole('button', { name: 'Urlaub' }).click()

    // Verify the new PTO entry uses the updated 8.5 hours
    const ptoCard = page.locator('[data-testid="time-entry-card-pto"]')
    await expect(ptoCard).toBeVisible()
    await expect(ptoCard.getByText('08:30:00')).toBeVisible()
  })

  test('should switch language and update UI accordingly', async ({ page }) => {
    // Go to settings
    await page.getByRole('link', { name: 'Einstellungen' }).click()
    await page.waitForURL('/settings')
    // Switch to English
    await page.getByLabel('Sprache').click()
    await page.getByRole('option', { name: 'Englisch' }).click()
    await page.getByRole('button', { name: 'Einstellungen speichern' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Einstellungen gespeichert',
    )
    // Check that a key label is now in English
    await expect(page.getByLabel('Default daily work hours')).toBeVisible()
    // Switch back to German
    await page.getByLabel('Language').click()
    await page.getByRole('option', { name: 'German' }).click()
    await page.getByRole('button', { name: 'Save settings' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Settings Saved',
    )
    await expect(page.getByLabel('Tägliche Standardarbeitszeit')).toBeVisible()
  })

  test('should show a validation error when trying to save invalid settings', async ({
    page,
  }) => {
    // Go to settings
    await page.getByRole('link', { name: 'Einstellungen' }).click()
    await page.waitForURL('/settings')
    // Try to set an invalid daily work hours
    await page.getByLabel('Tägliche Standardarbeitszeit').fill('10.5')
    await expect(page.getByText('Cannot be more than 10 hours')).toBeVisible()

    await page.getByRole('button', { name: 'Einstellungen speichern' }).click()
    // Check for validation error
    await expect(page.getByText('Cannot be more than 10 hours')).toBeVisible()
  })

  test('should update company details and see them in export preview', async ({
    page,
  }) => {
    // Go to settings
    await page.getByRole('link', { name: 'Einstellungen' }).click()
    await page.waitForURL('/settings')
    // Fill company details
    await page.getByLabel('Firmenname').fill('Testfirma GmbH')
    await page.getByLabel('Firmen-E-Mail').fill('info@testfirma.de')
    await page.getByLabel('Telefonnummer 1').fill('0301234567')
    await page.getByLabel('Telefonnummer 2').fill('0302334567')
    await page.getByLabel('Faxnummer').fill('0300456789')
    await page.getByRole('button', { name: 'Einstellungen speichern' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Einstellungen gespeichert',
    )

    // Go back to overview and then to export page
    await page.getByRole('link', { name: 'Zurück zur Übersicht' }).click()
    await page.waitForURL('/tracker')
    await page.getByRole('link', { name: 'Vorschau & Export' }).click()
    await page.waitForURL('/export')
    // Check for company details in export preview
    await expect(page.getByText('Testfirma GmbH')).toBeVisible()
    await expect(page.getByText('info@testfirma.de')).toBeVisible()
    await expect(page.getByText('0301234567')).toBeVisible()
    await expect(page.getByText('0302334567')).toBeVisible()
    await expect(page.getByText('0300456789')).toBeVisible()
  })

  test('should update display name and see it in the export preview', async ({
    page,
  }) => {
    // Go to settings
    await page.getByRole('link', { name: 'Einstellungen' }).click()
    await page.waitForURL('/settings')
    // Fill display name
    await page.getByLabel('Anzeigename').fill('Malcolm X')
    await page.getByRole('button', { name: 'Einstellungen speichern' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Einstellungen gespeichert',
    )
    // Go back to overview and then to export page
    await page.getByRole('link', { name: 'Zurück zur Übersicht' }).click()
    await page.waitForURL('/tracker')
    await page.getByRole('link', { name: 'Vorschau & Export' }).click()
    await page.waitForURL('/export')
    // Check for display name in export preview
    await expect(page.getByText('Malcolm X')).toBeVisible()
  })

  test('changing compensation percentages updates entry compensated time', async ({
    page,
  }) => {
    const location = 'Comp Test'
    // 1. Add an entry
    await addManualEntry(page, location, '09:00', '11:00')

    // 2. Edit the entry to set driver and passenger time to 1
    const entryCard = page.locator(`[data-location="${location}"]`)
    await expect(entryCard).toBeVisible()
    await entryCard.getByRole('button', { name: 'Bearbeiten' }).click()
    const editForm = page.locator(
      'div[role="dialog"]:has(h2:has-text("Zeiteintrag bearbeiten"))',
    )
    await expect(editForm).toBeVisible()
    await editForm.getByLabel('Fahrzeit (als Fahrer)').fill('1')
    await editForm.getByLabel('Fahrzeit (als Beifahrer)').fill('1')
    await editForm.getByRole('button', { name: 'Eintrag speichern' }).click()
    await expect(editForm).not.toBeVisible()

    // 3. Assert compensated time is correct for default percentages (2h work + 1h driver + 0.9h passenger = 3.9h = 03:54:00)
    // But the default is 100% driver, 90% passenger, so 2h + 1h + 0.9h = 3.9h = 03:54:00
    await expect(entryCard.getByText('03:54:00')).toBeVisible()

    // 4. Go to settings and change compensation percentages
    await page.getByRole('link', { name: 'Einstellungen' }).click()
    await page.waitForURL('/settings')
    await page.getByLabel('Vergütung Fahrerzeit (%)').fill('80')
    await page.getByLabel('Vergütung Beifahrerzeit (%)').fill('60')
    await page.getByRole('button', { name: 'Einstellungen speichern' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Einstellungen gespeichert',
    )

    // 5. Go back to tracker and check compensated time is updated (2h + 0.8h + 0.6h = 3.4h = 03:24:00)
    await page.getByRole('link', { name: 'Zurück zur Übersicht' }).click()
    await page.waitForURL('/tracker')
    await expect(entryCard.getByText('03:24:00')).toBeVisible()
  })
})
