import { expect, test } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('/login')
  })

  test('should log in and display the main tracker page', async ({ page }) => {
    // In test mode, we expect to see the mock user login screen.
    // The language is still English here, before a user is selected.
    await expect(
      page.getByRole('heading', { name: 'TimeWise Tracker (Test Mode)' }),
    ).toBeVisible()

    // Log in as the first mock user (Raquel, who uses German).
    await page
      .getByRole('button', { name: /Log in as/ })
      .first()
      .click()
    await page.waitForURL('/tracker')

    // Verify landing on the main tracker page by checking for key elements in German.
    await expect(page.getByText('Live-Zeiterfassung')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Erfassung starten' }),
    ).toBeVisible()
    await expect(page.getByText('Heute')).toBeVisible()
  })

  test('should log out and redirect to login page', async ({ page }) => {
    await page
      .getByRole('button', { name: /Log in as/ })
      .first()
      .click()
    await page.waitForURL('/tracker')

    // Click the user menu button to open dropdown
    await page.getByTestId('user-menu-btn').click()

    // Click the logout button in the dropdown
    await page.getByTestId('sign-out-btn').click()

    // Should be redirected to login page
    await expect(
      page.getByRole('heading', { name: /TimeWise Tracker/ }),
    ).toBeVisible()
  })

  test('should redirect to login if accessing protected pages when not logged in', async ({
    page,
  }) => {
    // Try to access main tracker page
    await expect(
      page.getByRole('heading', { name: /TimeWise Tracker/ }),
    ).toBeVisible()

    // Try to access settings page
    await page.goto('/preferences')
    await expect(
      page.getByRole('heading', { name: /TimeWise Tracker/ }),
    ).toBeVisible()

    // Try to access export page
    await page.goto('/export')
    await expect(
      page.getByRole('heading', { name: /TimeWise Tracker/ }),
    ).toBeVisible()
  })
})
