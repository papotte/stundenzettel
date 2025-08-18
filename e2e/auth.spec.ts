import { Page, expect, test } from '@playwright/test'

const loginAsMockUser = async (page: Page) => {
  await page.getByLabel('Email').fill('user@example.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByTestId('login-signin-button').click()
}
test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('/login')
  })

  test('should log in and display the main tracker page', async ({ page }) => {
    // In test mode, we expect to see the mock user login screen.
    // The language is still English here, before a user is selected.
    await expect(
      page.getByRole('heading', { name: 'TimeWise Tracker' }),
    ).toBeVisible()

    // Log in as the first mock user
    await loginAsMockUser(page)
    await page.waitForURL('/tracker')

    // Verify landing on the main tracker page
    await expect(page.getByText('Live Time Tracking')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Start Tracking' }),
    ).toBeVisible()
    await expect(page.getByText('Today')).toBeVisible()
  })

  test('should log out and redirect to login page', async ({ page }) => {
    await loginAsMockUser(page)

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

  test('should handle pricing page redirection flow correctly', async ({
    page,
  }) => {
    // Navigate to pricing page
    await page.goto('/pricing')

    // Verify pricing page is displayed
    await expect(
      page.getByRole('heading', {
        name: /Choose Your Plan/i,
      }),
    ).toBeVisible()
    // Find and click the first "Choose Plan" button
    const choosePlanButton = page
      .getByRole('button', { name: /Get Started/ })
      .first()
    await expect(choosePlanButton).toBeVisible()
    await choosePlanButton.click()

    // Should be redirected to login page with returnUrl parameter
    await page.waitForURL(/\/login\?returnUrl=/)

    // Verify we're on the login page
    await expect(
      page.getByRole('heading', { name: /TimeWise Tracker/ }),
    ).toBeVisible()

    // Verify the returnUrl parameter is present in the URL
    const currentUrl = page.url()
    expect(currentUrl).toContain('returnUrl=')
    expect(currentUrl).toContain('pricing')

    // Login with mock user
    await loginAsMockUser(page)

    // Should be redirected back to pricing page
    await page.waitForURL(/\/pricing/)

    // Verify we're back on the pricing page
    await expect(
      page.getByRole('heading', {
        name: /Choose Your Plan/i,
      }),
    ).toBeVisible()

    // Verify the plan parameter is preserved in the URL
    const finalUrl = page.url()
    expect(finalUrl).toContain('plan=')
  })

  test('should handle subscription page redirection flow correctly', async ({
    page,
  }) => {
    // Navigate to subscription page
    await page.goto('/subscription')

    // Should be redirected to login page with returnUrl parameter
    await page.waitForURL(/\/login\?returnUrl=/)

    // Verify we're on the login page
    await expect(
      page.getByRole('heading', { name: /TimeWise Tracker/ }),
    ).toBeVisible()

    // Verify the returnUrl parameter points to subscription page
    const currentUrl = page.url()
    expect(currentUrl).toContain('returnUrl=')
    expect(currentUrl).toContain('subscription')

    // Login with mock user
    await loginAsMockUser(page)

    // Should be redirected back to subscription page
    await page.waitForURL(/\/subscription/)

    // Verify we're on the subscription page
    await expect(
      page.getByRole('heading', {
        name: /Manage Subscription/,
      }),
    ).toBeVisible()
  })

  test('should handle team page redirection flow correctly', async ({
    page,
  }) => {
    // Navigate to team page
    await page.goto('/team')

    // Should be redirected to login page with returnUrl parameter
    await page.waitForURL(/\/login\?returnUrl=/)

    // Verify we're on the login page
    await expect(
      page.getByRole('heading', { name: /TimeWise Tracker/ }),
    ).toBeVisible()

    // Verify the returnUrl parameter points to team page
    const currentUrl = page.url()
    expect(currentUrl).toContain('returnUrl=')
    expect(currentUrl).toContain('team')

    // Login with mock user
    await loginAsMockUser(page)

    // Should be redirected back to team page
    await page.waitForURL(/\/team/)

    // Verify we're on the team page
    await expect(
      page.getByRole('heading', { name: /Team Management/ }),
    ).toBeVisible()
  })
})
