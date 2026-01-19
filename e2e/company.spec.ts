import { Page } from '@playwright/test'

import { expect, test } from './fixtures'
import { addActiveSubscription } from './subscription-helpers'
import { addManualEntry } from './test-helpers'

async function navigateToCompanyPage(page: Page) {
  const dropdown = page.locator('[data-testid="user-menu-btn"]')
  await dropdown.click()
  await expect(page.getByTestId('company')).toBeVisible()
  await page.getByTestId('company').click()
  await page.waitForURL('/company')
  await expect(page.getByRole('heading', { name: /Company/ })).toBeVisible()
}

test.describe('Company Page', () => {
  test.beforeEach(async ({ page, loginUser }) => {
    // Set up subscription mock before login to ensure it's available when the page loads
    await addActiveSubscription(page)

    await loginUser(page)
    await page.waitForURL('/tracker')
  })

  test('should save company details and compensation and reflect in tracker and export', async ({
    page,
  }) => {
    const location = 'Company E2E'
    await addManualEntry(page, location, '09:00', '11:00')

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

    await expect(entryCard.getByText('03:54:00')).toBeVisible()

    await navigateToCompanyPage(page)
    await page.getByLabel('Company Name').fill('Test Company GmbH')
    await page.getByLabel('Company Email').fill('info@testcompany.de')
    await page.getByLabel('Phone Number 1').fill('0301234567')
    await page.getByLabel('Phone Number 2').fill('0302334567')
    await page.getByLabel('Fax Number').fill('0300456789')
    await page.getByLabel('Driver time compensation (%)').fill('80')
    await page.getByLabel('Passenger time compensation (%)').fill('60')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Settings Saved',
    )

    await page.getByRole('link', { name: 'Back to Tracker' }).click()
    await page.waitForURL('/tracker')
    await expect(entryCard.getByText('03:24:00')).toBeVisible()

    await page.getByRole('link', { name: 'Preview & Export' }).click()
    await page.waitForURL('/export')
    await expect(page.getByText('Test Company GmbH')).toBeVisible()
    await expect(page.getByText('info@testcompany.de')).toBeVisible()
    await expect(page.getByText('0301234567')).toBeVisible()
    await expect(page.getByText('0302334567')).toBeVisible()
    await expect(page.getByText('0300456789')).toBeVisible()
  })
})
