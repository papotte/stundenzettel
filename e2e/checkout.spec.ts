import { expect, test } from './fixtures'
import {
  addActiveSubscription,
  clickPricingPlan,
  mockApiResponse,
  navigateToPricing,
  verifyCheckoutParameters,
  verifyErrorHandling,
  verifyTrialCheckoutParameters,
} from './subscription-helpers'

test.describe('Checkout and Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('/login')
  })

  test.describe('Checkout Session Creation', () => {
    test.beforeEach(async ({ page, loginUser }) => {
      await loginUser(page)
      await page.waitForURL('/tracker')
    })

    test('should create checkout session and redirect to Stripe', async ({
      page,
    }) => {
      const requestPromise = page.waitForRequest(
        (req) =>
          req.url().includes('create-checkout-session') &&
          req.method() === 'POST',
      )

      await navigateToPricing(page)
      await page.getByText('Individual Monthly')

      const choosePlanButton = page
        .getByRole('button', { name: /Get Started/ })
        .first()
      await expect(choosePlanButton).toBeVisible()
      await choosePlanButton.click()

      const checkoutRequest = await requestPromise
      const postData = checkoutRequest.postDataJSON()
      verifyCheckoutParameters(postData)
      verifyTrialCheckoutParameters(postData)

      await page.waitForURL(
        /^https:\/\/checkout\.stripe\.com\/c\/pay\/[a-zA-Z0-9_]+(#.*)?$/,
      )
    })

    test('should handle checkout session creation errors', async ({ page }) => {
      await mockApiResponse(page, '**/api/create-checkout-session', {
        status: 500,
        body: { error: 'Failed to create checkout session' },
      })

      await navigateToPricing(page)
      const choosePlanButton = page
        .getByRole('button', { name: /Get Started/ })
        .first()
      await clickPricingPlan(page)
      await verifyErrorHandling(page, choosePlanButton)
    })

    test('should handle success and cancel redirect URLs', async ({ page }) => {
      await page.goto('/subscription?success=true')
      await page.waitForURL(/\/subscription\?success=true/, { timeout: 10000 })
      await expect(page.getByRole('link', { name: 'Home' })).toBeVisible({
        timeout: 15000,
      })
      await expect(
        page.getByRole('heading', { name: /Manage Subscription/ }),
      ).toBeVisible()
      expect(page.url()).toContain('success=true')

      await page.goto('/pricing?canceled=true')
      await expect(
        page.getByRole('heading', { name: /Choose Your Plan/i }),
      ).toBeVisible()
      expect(page.url()).toContain('canceled=true')
    })
  })

  test.describe('Customer Portal', () => {
    test.beforeEach(async ({ page, loginUser }) => {
      await loginUser(page)
      await page.waitForURL('/tracker')
      await addActiveSubscription(page)
    })

    test('should create customer portal session and send correct params', async ({
      page,
    }) => {
      const requestPromise = page.waitForRequest(
        (req) =>
          req.url().includes('create-customer-portal-session') &&
          req.method() === 'POST',
      )

      await page.goto('/subscription')

      const manageBillingButton = page.getByRole('button', {
        name: /Manage Billing|Abrechnung verwalten/,
      })
      await expect(manageBillingButton).toBeVisible({ timeout: 10000 })
      await manageBillingButton.click()

      const portalRequest = await requestPromise
      const postData = portalRequest.postDataJSON()
      expect(postData).toHaveProperty('userId')
      expect(postData).toHaveProperty('returnUrl')
      expect(postData.returnUrl).toContain('/subscription')
    })
  })
})
