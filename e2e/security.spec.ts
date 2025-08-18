import { expect, test } from './fixtures'

test.describe('Security Page - Change Password', () => {
  test.beforeEach(async ({ page, loginOrRegisterTestUser }) => {
    // Use per-worker credentials to avoid cross-test interference
    await loginOrRegisterTestUser(page)
    await page.goto('/security')
    await expect(page.getByText('Security')).toBeVisible()
  })

  test('should successfully change password', async ({
    page,
    workerPassword,
  }) => {
    // Open the change password dialog
    await page.getByTestId('change-password-trigger').click()

    const newPassword = 'New_password123!'
    // Fill in the form
    await page.getByTestId('current-password-input').fill(workerPassword)
    await page.getByTestId('new-password-input').fill(newPassword)
    await page.getByTestId('confirm-password-input').fill(newPassword)

    // Submit
    await page.getByTestId('change-password-button').click()

    // Expect a success toast
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      /password.*updated/i,
    )

    // Change password back to original password
    await page.getByTestId('change-password-trigger').click()
    await page.getByTestId('current-password-input').fill(newPassword)
    await page.getByTestId('new-password-input').fill(workerPassword)
    await page.getByTestId('confirm-password-input').fill(workerPassword)
    await page.getByTestId('change-password-button').click()
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      /password.*updated/i,
    )
  })

  test('should show error for wrong current password', async ({ page }) => {
    // Open the change password dialog
    await page.getByTestId('change-password-trigger').click()

    // Fill in the form with wrong current password
    await page.getByTestId('current-password-input').fill('wrongpassword')
    await page.getByTestId('new-password-input').fill('New_password123!')
    await page.getByTestId('confirm-password-input').fill('New_password123!')

    // Submit
    await page.getByTestId('change-password-button').click()

    // Expect an error toast
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      /Error/i,
    )
    await expect(
      page.locator('[data-testid="toast-description"]'),
    ).toContainText(/current.*password|invalid/i)
  })
})
