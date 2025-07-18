import { Page, expect, test } from '@playwright/test'

import { addManualEntry } from './test-helpers'

async function navigateToCompanyPage(page: Page) {
  // Find the dropdown menu
  const dropdown = page.locator('[data-testid="user-menu-btn"]')
  // Click the dropdown to open it
  await dropdown.click()
  // Expect the preferences button to be visible, then click it
  await expect(page.getByTestId('company')).toBeVisible()
  await page.getByTestId('company').click()
}

test.describe('Company Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and log in as the first mock user (language is German)
    await page.goto('/login')
    await page
      .getByRole('button', { name: /Log in as/ })
      .first()
      .click()
    await page.waitForURL('/tracker')
  })

  test('should update company details and see them in export preview', async ({
    page,
  }) => {
    // Navigate to company settings
    await navigateToCompanyPage(page)

    // Fill company details
    await page.getByLabel('Firmenname').fill('Testfirma GmbH')
    await page.getByLabel('Firmen-E-Mail').fill('info@testfirma.de')
    await page.getByLabel('Telefonnummer 1').fill('0301234567')
    await page.getByLabel('Telefonnummer 2').fill('0302334567')
    await page.getByLabel('Faxnummer').fill('0300456789')
    await page.getByRole('button', { name: 'Speichern' }).click()
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
    await navigateToCompanyPage(page)
    await page.getByLabel('Vergütung Fahrerzeit (%)').fill('80')
    await page.getByLabel('Vergütung Beifahrerzeit (%)').fill('60')
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Einstellungen gespeichert',
    )

    // 5. Go back to tracker and check compensated time is updated (2h + 0.8h + 0.6h = 3.4h = 03:24:00)
    await page.getByRole('link', { name: 'Zurück zur Übersicht' }).click()
    await page.waitForURL('/tracker')
    await expect(entryCard.getByText('03:24:00')).toBeVisible()
  })
})
