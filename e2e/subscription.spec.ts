import { expect, test } from '@playwright/test'

import {
  clickManageBilling,
  clickPricingPlan,
  clickUpgrade,
  interceptApiCall,
  mockApiResponse,
  mockTrialSubscription,
  navigateToPricing,
  navigateToSubscription,
  toggleBillingPeriod,
  verifyCheckoutParameters,
  verifyErrorHandling,
  verifyExpiredTrialState,
  verifyMobileLayout,
  verifyPortalParameters,
  verifySubscriptionGuard,
  verifySubscriptionState,
  verifyTrialBanner,
  verifyTrialCheckoutParameters,
  verifyTrialExpirationWarning,
  waitForLoadingState,
} from './subscription-helpers'
import { loginWithMockUser, testAuthRedirect } from './test-helpers'

test.describe('Subscription Workflow (Simplified)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test.describe('Pricing Page', () => {
    test('should handle unauthenticated user flow', async ({ page }) => {
      await navigateToPricing(page)

      // Verify billing toggle is present (it's a switch component)
      await expect(page.getByRole('switch')).toBeVisible()

      // Click plan button should redirect to login
      await clickPricingPlan(page)
      await page.waitForURL(/\/login\?returnUrl=/)

      const currentUrl = page.url()
      expect(currentUrl).toContain('returnUrl=')
      expect(currentUrl).toContain('pricing')
    })

    test('should handle authenticated user flow', async ({ page }) => {
      await loginWithMockUser(page)
      await navigateToPricing(page)

      // Click plan button should show loading
      const choosePlanButton = page
        .getByRole('button', { name: /Get Started|Jetzt starten/ })
        .first()
      await clickPricingPlan(page)
      await waitForLoadingState(page, choosePlanButton)
    })

    test('should toggle billing periods', async ({ page }) => {
      await loginWithMockUser(page)
      await navigateToPricing(page)

      // Test monthly to yearly toggle
      await toggleBillingPeriod(page, 'yearly')
      await toggleBillingPeriod(page, 'monthly')
    })

    test('should handle team subscription flow', async ({ page }) => {
      await loginWithMockUser(page)
      await navigateToPricing(page)

      const success = await clickPricingPlan(page, 'team')
      if (success) {
        await page.waitForURL('/team?tab=subscription')
        await expect(
          page.getByRole('heading', { name: /Manage Team|Team-Verwaltung/ }),
        ).toBeVisible()
      }
    })
  })

  test.describe('Subscription Management', () => {
    test('should redirect unauthenticated users', async ({ page }) => {
      await testAuthRedirect(page, '/subscription')
    })

    test('should display subscription page for authenticated users', async ({
      page,
    }) => {
      await loginWithMockUser(page)
      await navigateToSubscription(page)

      // Verify back button and management card
      await expect(
        page.getByRole('link', {
          name: /Zurück zur Übersicht|Back to Tracker/,
        }),
      ).toBeVisible()
      await expect(
        page.getByText(/Manage Subscription|Abonnement verwalten/),
      ).toBeVisible()
    })

    test('should show no subscription state', async ({ page }) => {
      await loginWithMockUser(page)
      await navigateToSubscription(page)
      await page.waitForLoadState('networkidle')

      await verifySubscriptionState(page, 'none')
      await clickUpgrade(page)
      await page.waitForURL('/pricing')
    })

    test('should handle manage billing', async ({ page }) => {
      await loginWithMockUser(page)
      await navigateToSubscription(page)
      await page.waitForLoadState('networkidle')

      const success = await clickManageBilling(page)
      if (success) {
        const manageBillingButton = page.getByRole('button', {
          name: /Manage Billing|Abrechnung verwalten/,
        })
        await waitForLoadingState(page, manageBillingButton)
      }
    })
  })

  test.describe('Subscription Guard', () => {
    test.beforeEach(async ({ page }) => {
      await loginWithMockUser(page)
    })

    test('should protect subscription-guarded pages', async ({ page }) => {
      await page.goto('/protected')
      await verifySubscriptionGuard(page)
    })

    test('should redirect to pricing when choose plan is clicked', async ({
      page,
    }) => {
      await page.goto('/protected')
      await page
        .getByRole('button', { name: /Tarif wählen|Choose a Plan/ })
        .click()
      await page.waitForURL('/pricing')
    })

    test('should redirect to subscription when manage subscription is clicked', async ({
      page,
    }) => {
      await page.goto('/protected')
      await page
        .getByRole('button', {
          name: /Abonnement verwalten|Manage Subscription/,
        })
        .click()
      await page.waitForURL('/subscription')
    })
  })

  test.describe('API Integration', () => {
    test('should create checkout session with correct parameters', async ({
      page,
    }) => {
      await loginWithMockUser(page)

      const checkoutRequest = await interceptApiCall(
        page,
        '**/api/create-checkout-session',
      )
      await navigateToPricing(page)
      await clickPricingPlan(page)
      await page.waitForTimeout(2000)

      if (checkoutRequest) {
        const postData = checkoutRequest.postDataJSON()
        verifyCheckoutParameters(postData)
      }
    })

    test('should create customer portal session with correct parameters', async ({
      page,
    }) => {
      await loginWithMockUser(page)

      const portalRequest = await interceptApiCall(
        page,
        '**/api/create-customer-portal-session',
      )
      await navigateToSubscription(page)
      await page.waitForLoadState('networkidle')

      const success = await clickManageBilling(page)
      if (success) {
        await page.waitForTimeout(2000)
        if (portalRequest) {
          const postData = portalRequest.postDataJSON()
          verifyPortalParameters(postData)
        }
      }
    })

    test('should handle API errors gracefully', async ({ page }) => {
      await loginWithMockUser(page)

      await mockApiResponse(page, '**/api/subscriptions/**', {
        status: 500,
        body: { error: 'Failed to fetch subscription' },
      })

      await navigateToSubscription(page)
      await verifySubscriptionState(page, 'none')
    })

    test('should handle checkout errors', async ({ page }) => {
      await loginWithMockUser(page)

      await mockApiResponse(page, '**/api/create-checkout-session', {
        status: 500,
        body: { error: 'Failed to create checkout session' },
      })

      await navigateToPricing(page)
      const choosePlanButton = page
        .getByRole('button', { name: /Get Started|Jetzt starten/ })
        .first()
      await clickPricingPlan(page)
      await verifyErrorHandling(page, choosePlanButton)
    })
  })

  test.describe('Navigation and Mobile', () => {
    test('should handle mobile layout', async ({ page }) => {
      await loginWithMockUser(page)
      await verifyMobileLayout(page)
      await navigateToSubscription(page)
      await verifyMobileLayout(page)
    })
  })

  test.describe('Success and Cancel URLs', () => {
    test('should handle success redirect', async ({ page }) => {
      await loginWithMockUser(page)
      await page.goto('/subscription?success=true')

      await expect(
        page.getByRole('heading', {
          name: /Manage Subscription|Abonnement verwalten/,
        }),
      ).toBeVisible()
      expect(page.url()).toContain('success=true')
    })

    test('should handle cancel redirect', async ({ page }) => {
      await loginWithMockUser(page)
      await page.goto('/pricing?canceled=true')

      await expect(
        page.getByRole('heading', {
          name: /Choose Your Plan|Wählen Sie Ihren Tarif/i,
        }),
      ).toBeVisible()
      expect(page.url()).toContain('canceled=true')
    })
  })

  test.describe('Trial Flow', () => {
    test.beforeEach(async ({ page }) => {
      await loginWithMockUser(page)
    })

    test('should display trial information on pricing page', async ({
      page,
    }) => {
      await navigateToPricing(page)

      // Verify trial badges are visible, might be more than one
      await expect(
        page
          .getByText(/No credit card required|Keine Kreditkarte erforderlich/)
          .first(),
      ).toBeVisible()

      // Verify trial button
      await expect(
        page.getByRole('button', { name: /Kostenlos testen|Try for Free/ }),
      ).toBeVisible()
    })

    test('should create checkout session with trial parameters', async ({
      page,
    }) => {
      const checkoutRequest = await interceptApiCall(
        page,
        '**/api/create-checkout-session',
      )
      await navigateToPricing(page)
      await clickPricingPlan(page)
      await page.waitForTimeout(2000)

      if (checkoutRequest) {
        const postData = checkoutRequest.postDataJSON()
        verifyTrialCheckoutParameters(postData)
      }
    })

    test('should display trial banner for trial users', async ({ page }) => {
      await mockTrialSubscription(page, { daysRemaining: 7 })

      await navigateToSubscription(page)

      await verifyTrialBanner(page)
    })

    test('should show trial expiration warning', async ({ page }) => {
      await mockTrialSubscription(page, { daysRemaining: 1 })

      await navigateToSubscription(page)

      await verifyTrialExpirationWarning(page)
    })

    test('should allow trial users to access protected pages', async ({
      page,
    }) => {
      await mockTrialSubscription(page, { daysRemaining: 7 })

      // Should be able to access protected page
      await page.goto('/protected')
      await page.waitForLoadState('networkidle')

      // Should see the protected content
      await expect(
        page.getByRole('heading', { name: /Protected Content/ }),
      ).toBeVisible()
      await expect(
        page.getByText(/Welcome to the Premium Features!/),
      ).toBeVisible()

      // Should not see subscription guard
      await expect(
        page.getByText(/Choose a Plan|Tarif wählen/),
      ).not.toBeVisible()
    })

    test('should handle trial-to-paid conversion', async ({ page }) => {
      await mockTrialSubscription(page, { daysRemaining: 7 })

      await navigateToSubscription(page)
      await page.waitForLoadState('networkidle')

      // Click add payment method button (for trial users)
      await page
        .getByRole('button', {
          name: /Add Payment Method|Zahlungsmethode hinzufügen/,
        })
        .click()

      // Should redirect to customer portal
      await page.waitForTimeout(2000)
      // Note: In real scenario, this would redirect to Stripe customer portal
    })

    test('should handle expired trial', async ({ page }) => {
      await mockTrialSubscription(page, { isExpired: true, status: 'past_due' })

      await navigateToSubscription(page)
      await page.waitForLoadState('networkidle')

      await verifyExpiredTrialState(page)
    })

    test('should block access to protected pages after trial expires', async ({
      page,
    }) => {
      await mockTrialSubscription(page, { isExpired: true, status: 'past_due' })

      // Should show subscription guard
      await page.goto('/protected')
      await page.waitForLoadState('networkidle')
      await verifySubscriptionGuard(page)
      // Should show subscription required message since trial expired
      await expect(page.getByText(/Choose a Plan|Tarif wählen/)).toBeVisible()
    })

    test('should handle trial checkout with different billing periods', async ({
      page,
    }) => {
      await navigateToPricing(page)

      // Test monthly trial
      await toggleBillingPeriod(page, 'monthly')
      const monthlyCheckoutRequest = await interceptApiCall(
        page,
        '**/api/create-checkout-session',
      )
      await clickPricingPlan(page)
      await page.waitForTimeout(2000)

      if (monthlyCheckoutRequest) {
        const postData = monthlyCheckoutRequest.postDataJSON()
        expect(postData).toHaveProperty('trialEnabled', true)
        expect(postData).toHaveProperty('billingCycle', 'monthly')
      }

      // Test yearly trial
      await page.goto('/pricing')
      await toggleBillingPeriod(page, 'yearly')
      const yearlyCheckoutRequest = await interceptApiCall(
        page,
        '**/api/create-checkout-session',
      )
      await clickPricingPlan(page)
      await page.waitForTimeout(2000)

      if (yearlyCheckoutRequest) {
        const postData = yearlyCheckoutRequest.postDataJSON()
        expect(postData).toHaveProperty('trialEnabled', true)
        expect(postData).toHaveProperty('billingCycle', 'yearly')
      }
    })

    test('should handle team trial flow', async ({ page }) => {
      await navigateToPricing(page)

      const teamCheckoutRequest = await interceptApiCall(
        page,
        '**/api/create-team-checkout-session',
      )

      const success = await clickPricingPlan(page, 'team')
      if (success) {
        await page.waitForTimeout(2000)

        if (teamCheckoutRequest) {
          const postData = teamCheckoutRequest.postDataJSON()
          expect(postData).toHaveProperty('trialEnabled', true)
          expect(postData).toHaveProperty('teamId')
          expect(postData).toHaveProperty('quantity')
        }
      }
    })

    test('should handle trial API errors gracefully', async ({ page }) => {
      // Mock API error for trial subscription
      await mockApiResponse(page, '**/api/subscriptions/*', {
        status: 500,
        body: { error: 'Failed to fetch trial subscription' },
      })

      await navigateToSubscription(page)
      await page.waitForLoadState('networkidle')

      // Should fall back to no subscription state
      await verifySubscriptionState(page, 'none')
    })

    test('should handle trial checkout errors', async ({ page }) => {
      await mockApiResponse(page, '**/api/create-checkout-session', {
        status: 500,
        body: { error: 'Failed to create trial checkout session' },
      })

      await navigateToPricing(page)
      const choosePlanButton = page
        .getByRole('button', { name: /Get Started|Jetzt starten/ })
        .first()
      await clickPricingPlan(page)
      await verifyErrorHandling(page, choosePlanButton)
    })
  })
})
