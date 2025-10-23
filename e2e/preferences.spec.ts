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

  test('should update preferences and reflect changes', async ({ page }) => {
    // Change default work hours from 7 to 8.5
    await page.getByLabel('Default daily work hours').fill('8.5')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Settings Saved',
    )

    // Go back and add a PTO day
    await page.getByRole('link', { name: 'Back to Tracker' }).click()
    await page.waitForURL('/tracker')

    await page.getByRole('button', { name: 'Paid Time Off' }).click()

    // Verify the new PTO entry uses the updated 8.5 hours
    const ptoCard = page.locator('[data-testid="time-entry-card-pto"]')
    await expect(ptoCard).toBeVisible()
    await expect(ptoCard.getByText('08:30:00')).toBeVisible()
  })

  test('should switch language and update UI accordingly', async ({ page }) => {
    // Switch to English
    await page.getByLabel('Language').click()
    await page.getByRole('option', { name: 'English' }).click()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Settings Saved',
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
    await expect(page.getByLabel('Default daily work hours')).toBeVisible()
  })

  test('should show a validation error when trying to save invalid settings', async ({
    page,
  }) => {
    // Try to set an invalid daily work hours
    await page.getByLabel('Default daily work hours').fill('10.5')
    await expect(page.getByText('Cannot be more than 10 hours')).toBeVisible()

    await page.getByRole('button', { name: 'Save' }).click()
    // Check for validation error
    await expect(page.getByText('Cannot be more than 10 hours')).toBeVisible()
  })

  test('should update display name and see it in the export preview', async ({
    page,
  }) => {
    // Fill display name
    await page.getByLabel('Display Name').fill('Malcolm X')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Settings Saved',
    )
    // Go back to overview and then to export page
    await page.getByRole('link', { name: 'Back to Tracker' }).click()
    await page.waitForURL('/tracker')
    await page.getByRole('link', { name: 'Preview & Export' }).click()
    await page.waitForURL('/export')
    // Check for display name in export preview
    await expect(page.getByText('Malcolm X')).toBeVisible()
  })

  test('should auto-calculate expected monthly hours when default work hours change', async ({
    page,
  }) => {
    // Change default work hours from 7 to 8
    await page.getByLabel('Default daily work hours').fill('8')

    // Check that expected monthly hours is auto-calculated
    // 8 × 260 ÷ 12 = 173.333... → 173 (rounded to nearest 0.5)
    const expectedHoursInput = page.getByLabel('Expected Hours per Month')
    await expect(expectedHoursInput).toHaveValue('173')

    // Save the settings
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Settings Saved',
    )
  })

  test('should allow user to override expected monthly hours', async ({
    page,
  }) => {
    // First change default work hours to trigger auto-calculation
    await page.getByLabel('Default daily work hours').fill('8')

    // Verify auto-calculation worked
    const expectedHoursInput = page.getByLabel('Expected Hours per Month')
    await expect(expectedHoursInput).toHaveValue('173')

    // Now manually override the expected monthly hours
    await expectedHoursInput.fill('200')
    await expect(expectedHoursInput).toHaveValue('200')

    // Check that reset button appears
    await expect(page.getByText('Reset to auto-calculation')).toBeVisible()

    // Save the settings
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      'Settings Saved',
    )

    // Verify the override persisted by refreshing and checking the value
    await page.reload()
    await expect(expectedHoursInput).toHaveValue('200')

    // Verify that changing default work hours doesn't recalculate the overridden value
    await page.getByLabel('Default daily work hours').fill('7')
    await expect(expectedHoursInput).toHaveValue('200') // Should still be 200, not recalculated
  })
})
