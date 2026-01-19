import { expect, test } from './fixtures'

test.describe('Authentication', () => {
  test('should log in and display the main tracker page', async ({
    page,
    loginUser,
  }) => {
    // Navigate to login page
    await page.goto('/login')

    // In test mode, we expect to see the mock user login screen
    await expect(
      page.getByRole('heading', { name: 'TimeWise Tracker' }),
    ).toBeVisible()

    // Log in as the test user
    await loginUser(page)
    await page.waitForURL('/tracker')

    // Verify landing on the main tracker page
    await expect(page.getByText('Live Time Tracking')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Start Tracking' }),
    ).toBeVisible()
  })

  test('should redirect to login if accessing protected pages when not logged in', async ({
    page,
  }) => {
    // Try to access a protected page
    await page.goto('/tracker')

    // Should be redirected to login page
    await page.waitForURL(/\/login/)
    await expect(
      page.getByRole('heading', { name: /TimeWise Tracker/ }),
    ).toBeVisible()
  })
})
