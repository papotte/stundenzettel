import { expect, test } from './fixtures'
import {
  mockNoSubscription,
  mockTrialSubscription,
  verifySubscriptionGuard,
} from './subscription-helpers'

test.describe('Subscription Guard', () => {
  test.beforeEach(async ({ page, loginUser }) => {
    await loginUser(page)
  })

  test('should redirect to pricing when choose plan is clicked', async ({
    page,
  }) => {
    await mockNoSubscription(page)
    await page.goto('/protected')
    await verifySubscriptionGuard(page)
    await page.getByRole('button', { name: /Choose a Plan/ }).click()
    await page.waitForURL('/pricing')
  })

  test('should redirect to subscription when manage subscription is clicked', async ({
    page,
  }) => {
    await mockNoSubscription(page)
    await page.goto('/protected')
    await page.getByRole('button', { name: /Manage Subscription/ }).click()
    await page.waitForURL('/subscription')
  })

  test('should allow trial users to access protected pages', async ({
    page,
  }) => {
    await mockTrialSubscription(page, { daysRemaining: 7 })

    await page.goto('/protected')

    // Should see the protected content
    await expect(
      page.getByRole('heading', { name: /Protected Content/ }),
    ).toBeVisible()
    await expect(
      page.getByText(/Welcome to the Premium Features!/),
    ).toBeVisible()

    // Should not see subscription guard
    await expect(page.getByText(/Choose a Plan/)).not.toBeVisible()
  })

  test('should block access to protected pages after trial expires', async ({
    page,
  }) => {
    await mockTrialSubscription(page, { isExpired: true, status: 'past_due' })

    await page.goto('/protected')
    await verifySubscriptionGuard(page)
    await expect(page.getByText(/Choose a Plan/)).toBeVisible()
  })
})
