import { expect, test } from './fixtures'
import { addActiveSubscription } from './subscription-helpers'

test.describe('Preferences Page', () => {
  test.beforeEach(async ({ page, loginUser }) => {
    // Set up subscription mock before login to ensure it's available when the page loads
    await addActiveSubscription(page)

    await loginUser(page)
    await page.waitForURL('/tracker')

    // Find the dropdown menu
    const dropdown = page.locator('[data-testid="user-menu-btn"]')
    // Click the dropdown to open it
    await dropdown.click()
    // Expect the preferences button to be visible, then click it
    await expect(page.getByTestId('preferences')).toBeVisible()
    await page.getByTestId('preferences').click()
  })

  test('should update preferences and reflect in tracker and export', async ({
    page,
  }) => {
    await page.getByLabel('Default daily work hours').fill('8.5')
    await page.getByLabel('Display Name').fill('Malcolm X')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Settings Saved',
    )

    await page.getByRole('link', { name: 'Back to Tracker' }).click()
    await page.waitForURL('/tracker')

    await page.getByRole('button', { name: 'Paid Time Off' }).click()
    const ptoCard = page.locator('[data-testid="time-entry-card-pto"]')
    await expect(ptoCard).toBeVisible()
    await expect(ptoCard.getByText('08:30:00')).toBeVisible()

    await page.getByRole('link', { name: 'Preview & Export' }).click()
    await page.waitForURL('/export')
    await expect(page.getByText('Malcolm X')).toBeVisible()
  })

  test('should switch language and update UI accordingly', async ({ page }) => {
    await page.getByLabel('Language').click()
    await page.getByRole('option', { name: 'English' }).click()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Settings Saved',
    )
    await expect(page.getByLabel('Default daily work hours')).toBeVisible()

    await page.getByLabel('Language').click()
    await page.getByRole('option', { name: 'German' }).click()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Settings Saved',
    )
    await expect(page.getByLabel('Tägliche Standardarbeitszeit')).toBeVisible()
  })
})
