import { expect, test } from '@playwright/test'

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

  test('should update default driver and see it marked in the time form', async ({
    page,
  }) => {
    // Go to settings
    await page.getByRole('link', { name: 'Einstellungen' }).click()
    await page.waitForURL('/settings')
    // Set default driver checkbox
    await page.getByLabel('Standardmäßig als Fahrer').click()
    await expect(page.getByLabel('Standardmäßig als Fahrer')).toBeChecked()
    await page.getByRole('button', { name: 'Einstellungen speichern' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Einstellungen gespeichert',
    )
    // Go back to overview and then to time form
    await page.getByRole('link', { name: 'Zurück zur Übersicht' }).click()
    await page.waitForURL('/tracker')
    await page.getByRole('button', { name: /Hinzufügen|Add/i }).click()
    const dialog = page.locator('div[role="dialog"]')
    await expect(dialog).toBeVisible()
    // Check for default driver marked in the time form
    await expect(page.getByLabel('Fahrer')).toBeChecked()
    // Cancel the dialog
    await page.getByTestId('sheet-close-button').click()

    await expect(dialog).not.toBeVisible()

    // Go back to settings and unset default driver
    await page.getByRole('link', { name: 'Einstellungen' }).click()
    await page.waitForURL('/settings')
    // Unset default driver checkbox
    await page.getByLabel('Standardmäßig als Fahrer').click()
    await expect(page.getByLabel('Standardmäßig als Fahrer')).not.toBeChecked()
    await page.getByRole('button', { name: 'Einstellungen speichern' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Einstellungen gespeichert',
    )
    // Go back to overview and then to time form
    await page.getByRole('link', { name: 'Zurück zur Übersicht' }).click()
    await page.waitForURL('/tracker')
    await page.getByRole('button', { name: /Hinzufügen|Add/i }).click()
    await expect(dialog).toBeVisible()
    // Check for default driver marked in the time form
    await expect(page.getByLabel('Fahrer')).not.toBeChecked()
  })
})
