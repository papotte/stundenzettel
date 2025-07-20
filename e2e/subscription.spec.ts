import { expect, test } from '@playwright/test'

import {
  clickManageBilling,
  clickPricingPlan,
  clickUpgrade,
  interceptApiCall,
  loginWithMockUser,
  mockApiResponse,
  navigateToPricing,
  navigateToSubscription,
  navigateToTeam,
  testAuthRedirect,
  testNavigationFlow,
  toggleBillingPeriod,
  verifyCheckoutParameters,
  verifyErrorHandling,
  verifyMobileLayout,
  verifyPortalParameters,
  verifySubscriptionGuard,
  verifySubscriptionState,
  waitForLoadingState,
} from './subscription-helpers'

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
        await page.waitForURL('/team')
        await expect(page.getByRole('heading', { name: /Team/ })).toBeVisible()
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

  test.describe('Team Page', () => {
    test('should redirect unauthenticated users', async ({ page }) => {
      await testAuthRedirect(page, '/team')
    })

    test('should display team page for authenticated users', async ({
      page,
    }) => {
      await loginWithMockUser(page)
      await navigateToTeam(page)

      // Verify back button and team management card
      await expect(
        page.getByRole('link', {
          name: /Zurück zur Übersicht|Back to Tracker/,
        }),
      ).toBeVisible()
      await expect(page.getByText(/Manage Team|Team verwalten/)).toBeVisible()
      await expect(
        page.getByText(
          /Team Management Coming Soon|Team-Verwaltung kommt bald/,
        ),
      ).toBeVisible()
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
    test('should navigate between subscription pages', async ({ page }) => {
      await loginWithMockUser(page)
      await testNavigationFlow(page, '/subscription', '/team')
    })

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
        page.getByRole('heading', { name: /Subscription|Abonnement/ }),
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
})
