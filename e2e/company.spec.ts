import { Page } from '@playwright/test'

import { expect, test } from './fixtures'
import { addActiveSubscription } from './subscription-helpers'
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
  test.beforeEach(async ({ page, loginUser }) => {
    // Set up subscription mock before login to ensure it's available when the page loads
    await addActiveSubscription(page)

    await loginUser(page)
    await page.waitForURL('/tracker')
  })

  test('should update company details and see them in export preview', async ({
    page,
  }) => {
    // Navigate to company settings
    await navigateToCompanyPage(page)

    // Fill company details
    await page.getByLabel('Company Name').fill('Test Company GmbH')
    await page.getByLabel('Company Email').fill('info@testcompany.de')
    await page.getByLabel('Phone Number 1').fill('0301234567')
    await page.getByLabel('Phone Number 2').fill('0302334567')
    await page.getByLabel('Fax Number').fill('0300456789')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Settings Saved',
    )

    // Go back to overview and then to export page
    await page.getByRole('link', { name: 'Back to Tracker' }).click()
    await page.waitForURL('/tracker')
    await page.getByRole('link', { name: 'Preview & Export' }).click()
    await page.waitForURL('/export')
    // Check for company details in export preview
    await expect(page.getByText('Test Company GmbH')).toBeVisible()
    await expect(page.getByText('info@testcompany.de')).toBeVisible()
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
    await entryCard.getByRole('button', { name: 'Edit' }).click()
    const editForm = page.locator(
      'div[role="dialog"]:has(h2:has-text("Edit Time Entry"))',
    )
    await expect(editForm).toBeVisible()
    await editForm.getByLabel('Driving Time (as Driver)').fill('1')
    await editForm.getByLabel('Driving Time (as Passenger)').fill('1')
    await editForm.getByRole('button', { name: 'Save Entry' }).click()
    await expect(editForm).not.toBeVisible()

    // 3. Assert compensated time is correct for default percentages (2h work + 1h driver + 0.9h passenger = 3.9h = 03:54:00)
    // But the default is 100% driver, 90% passenger, so 2h + 1h + 0.9h = 3.9h = 03:54:00
    await expect(entryCard.getByText('03:54:00')).toBeVisible()

    // 4. Go to settings and change compensation percentages
    await navigateToCompanyPage(page)
    await page.getByLabel('Driver time compensation (%)').fill('80')
    await page.getByLabel('Passenger time compensation (%)').fill('60')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Settings Saved',
    )

    // 5. Go back to tracker and check compensated time is updated (2h + 0.8h + 0.6h = 3.4h = 03:24:00)
    await page.getByRole('link', { name: 'Back to Tracker' }).click()
    await page.waitForURL('/tracker')
    await expect(entryCard.getByText('03:24:00')).toBeVisible()
  })
})
