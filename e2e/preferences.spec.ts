import { expect, test } from '@playwright/test'

test.describe('Preferences Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and log in as the first mock user (language is German)
    await page.goto('/login')
    await page
      .getByRole('button', { name: /Log in as/ })
      .first()
      .click()
    await page.waitForURL('/tracker')

    // Find the dropdown menu
    const dropdown = page.locator('[data-testid="user-menu-btn"]')
    // Click the dropdown to open it
    await dropdown.click()
    // Expect the preferences button to be visible, then click it
    await expect(page.getByTestId('preferences')).toBeVisible()
    await page.getByTestId('preferences').click()
  })

  test('should update preferences and reflect changes', async ({ page }) => {
    // Change default work hours from 7 to 8.5
    await page.getByLabel('Tägliche Standardarbeitszeit').fill('8.5')
    await page.getByRole('button', { name: 'Speichern' }).click()
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
    // Switch to English
    await page.getByLabel('Sprache').click()
    await page.getByRole('option', { name: 'Englisch' }).click()
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Einstellungen gespeichert',
    )
    // Check that a key label is now in English
    await expect(page.getByLabel('Default daily work hours')).toBeVisible()
    // Switch back to German
    await page.getByLabel('Language').click()
    await page.getByRole('option', { name: 'German' }).click()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Settings Saved',
    )
    await expect(page.getByLabel('Tägliche Standardarbeitszeit')).toBeVisible()
  })

  test('should show a validation error when trying to save invalid settings', async ({
    page,
  }) => {
    // Try to set an invalid daily work hours
    await page.getByLabel('Tägliche Standardarbeitszeit').fill('10.5')
    await expect(page.getByText('Cannot be more than 10 hours')).toBeVisible()

    await page.getByRole('button', { name: 'Speichern' }).click()
    // Check for validation error
    await expect(page.getByText('Cannot be more than 10 hours')).toBeVisible()
  })

  test('should update display name and see it in the export preview', async ({
    page,
  }) => {
    // Fill display name
    await page.getByLabel('Anzeigename').fill('Malcolm X')
    await page.getByRole('button', { name: 'Speichern' }).click()
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
})
