import { Page, expect, test } from '@playwright/test'

// Helper to login as the first mock user
async function loginAsMockUser(page: Page) {
  await page.goto('/login')
  await page
    .getByRole('button', { name: /Log in as/ })
    .first()
    .click()
  await page.waitForURL('/tracker')
}

test.describe('Security Page - Change Password', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsMockUser(page)
    await page.goto('/security')
    await page.waitForLoadState('networkidle')
  })

  test('should successfully change password', async ({ page }) => {
    // Open the change password dialog
    await page.getByTestId('change-password-trigger').click()

    // Fill in the form
    await page.getByTestId('current-password-input').fill('currentpass')
    await page.getByTestId('new-password-input').fill('New_password123!')
    await page.getByTestId('confirm-password-input').fill('New_password123!')

    // Submit
    await page.getByTestId('change-password-button').click()

    // Expect a success toast
    await expect(page.locator('[data-testid="toast-title"]')).toContainText(
      /Passwort.*aktualisiert|password.*updated/i,
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
      /Fehler|Error/i,
    )
    await expect(
      page.locator('[data-testid="toast-description"]'),
    ).toContainText(/aktuell.*Passwort|current.*password|ungültig|invalid/i)
  })
})
