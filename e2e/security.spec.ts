import { expect, test } from './fixtures'

test.describe('Security Page - Change Password', () => {
  test.beforeEach(async ({ page, loginUser }) => {
    // Use per-worker credentials to avoid cross-test interference
    await loginUser(page)
    await page.goto('/security')
    await expect(page.getByText('Security')).toBeVisible()
  })

  test('should change password: error for wrong current, then success and revert', async ({
    page,
    workerPassword,
  }) => {
    const newPassword = 'New_password123!'

    // Wrong current password → error toast
    await page.getByTestId('change-password-trigger').click()
    await page.getByTestId('current-password-input').fill('wrongpassword')
    await page.getByTestId('new-password-input').fill(newPassword)
    await page.getByTestId('confirm-password-input').fill(newPassword)
    await page.getByTestId('change-password-button').click()

    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      /Error/i,
    )
    await expect(
      page.locator('[data-testid="toast-description"]'),
    ).toContainText(/current.*password|invalid/i)

    await page.getByTestId('cancel-button').click()

    // Correct current → success, then revert to original
    await page.getByTestId('change-password-trigger').click()
    await page.getByTestId('current-password-input').fill(workerPassword)
    await page.getByTestId('new-password-input').fill(newPassword)
    await page.getByTestId('confirm-password-input').fill(newPassword)
    await page.getByTestId('change-password-button').click()

    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      /password.*updated/i,
    )

    await page.getByTestId('change-password-trigger').click()
    await page.getByTestId('current-password-input').fill(newPassword)
    await page.getByTestId('new-password-input').fill(workerPassword)
    await page.getByTestId('confirm-password-input').fill(workerPassword)
    await page.getByTestId('change-password-button').click()

    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      /password.*updated/i,
    )
  })
})
