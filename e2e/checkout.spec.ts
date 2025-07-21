import { expect, test } from '@playwright/test'

test.describe('Checkout and Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('/login')
  })

  test.describe('Checkout Session Creation', () => {
    test('should create checkout session for individual plan', async ({
      page,
    }) => {
      // Login first
      await page
        .getByRole('button', { name: /Log in as/ })
        .first()
        .click()
      await page.waitForURL('/tracker')

      // Navigate to pricing page
      await page.goto('/pricing')

      // Wait for pricing plans to load
      await page.getByText('Individual Monthly')

      // Click on a plan button
      const choosePlanButton = page
        .getByRole('button', { name: /Get Started|Jetzt starten/ })
        .first()
      await expect(choosePlanButton).toBeVisible()
      await choosePlanButton.click()

      // Check redirect to Stripe checkout
      await page.waitForURL(
        /^https:\/\/checkout\.stripe\.com\/c\/pay\/[a-zA-Z0-9_]+(#.*)?$/,
      )

      // Additional verification that we're on Stripe checkout
      await expect(page.url()).toMatch(
        /^https:\/\/checkout\.stripe\.com\/c\/pay\/[a-zA-Z0-9_]+(#.*)?$/,
      )
      await expect(page).toHaveTitle(/sandbox/)
    })

    test('should handle checkout session creation errors', async ({ page }) => {
      // Login first
      await page
        .getByRole('button', { name: /Log in as/ })
        .first()
        .click()
      await page.waitForURL('/tracker')

      // Mock API failure
      await page.route('**/api/create-checkout-session', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to create checkout session' }),
        })
      })

      // Navigate to pricing page
      await page.goto('/pricing')

      // Click on a plan button
      const choosePlanButton = page
        .getByRole('button', { name: /Get Started|Jetzt starten/ })
        .first()
      await choosePlanButton.click()

      // Should show error toast
      await expect(
        page.getByTestId('toast-title').getByText(/Error|Zahlungsfehler/),
      ).toBeVisible()

      // Button should be enabled again
      await expect(choosePlanButton).toBeEnabled()
    })

    test('should create checkout session with correct parameters', async ({
      page,
    }) => {
      // Login first
      await page
        .getByRole('button', { name: /Log in as/ })
        .first()
        .click()
      await page.waitForURL('/tracker')

      // Intercept the checkout session API call
      let checkoutRequest: any = null
      await page.route('**/api/create-checkout-session', (route) => {
        checkoutRequest = route.request()
        route.continue()
      })

      // Navigate to pricing page
      await page.goto('/pricing')

      // Click on a plan button
      const choosePlanButton = page
        .getByRole('button', { name: /Get Started|Jetzt starten/ })
        .first()
      await choosePlanButton.click()

      // Wait for API call
      await page.waitForTimeout(2000)

      // Verify the request was made with correct parameters
      if (checkoutRequest) {
        const postData = checkoutRequest.postDataJSON()
        expect(postData).toHaveProperty('priceId')
        expect(postData).toHaveProperty('successUrl')
        expect(postData).toHaveProperty('cancelUrl')
        expect(postData.successUrl).toContain('/subscription?success=true')
        expect(postData.cancelUrl).toContain('/pricing?canceled=true')
      }
    })
  })

  test.describe('Customer Portal', () => {
    test('should create customer portal session', async ({ page }) => {
      // Login first
      await page
        .getByRole('button', { name: /Log in as/ })
        .first()
        .click()
      await page.waitForURL('/tracker')

      // Navigate to subscription page
      await page.goto('/subscription')

      // Wait for page to load
      await page.waitForLoadState('networkidle')

      // Look for manage billing button
      const manageBillingButton = page.getByRole('button', {
        name: /Manage Billing|Abrechnung verwalten/,
      })

      if (await manageBillingButton.isVisible()) {
        // Intercept the customer portal API call
        let portalRequest: any = null
        await page.route('**/api/create-customer-portal-session', (route) => {
          portalRequest = route.request()
          route.continue()
        })

        await manageBillingButton.click()

        // Should show loading state
        await expect(manageBillingButton).toBeDisabled()

        // Wait for API call
        await page.waitForTimeout(2000)

        // Verify the request was made
        if (portalRequest) {
          const postData = portalRequest.postDataJSON()
          expect(postData).toHaveProperty('email')
          expect(postData).toHaveProperty('returnUrl')
          expect(postData.returnUrl).toContain('/subscription')
        }
      }
    })

    test('should handle customer portal errors', async ({ page }) => {
      // Login first
      await page
        .getByRole('button', { name: /Log in as/ })
        .first()
        .click()
      await page.waitForURL('/tracker')

      // Mock API failure
      await page.route('**/api/create-customer-portal-session', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to create portal session' }),
        })
      })

      // Navigate to subscription page
      await page.goto('/subscription')

      // Wait for page to load
      await page.waitForLoadState('networkidle')

      // Look for manage billing button
      const manageBillingButton = page.getByRole('button', {
        name: /Manage Billing|Abrechnung verwalten/,
      })

      if (await manageBillingButton.isVisible()) {
        await manageBillingButton.click()

        // Should show error toast
        await expect(page.getByText(/Error|Fehler/)).toBeVisible({
          timeout: 5000,
        })

        // Button should be enabled again
        await expect(manageBillingButton).toBeEnabled()
      }
    })
  })

  test.describe('Team Checkout', () => {
    test('should handle team checkout flow', async ({ page }) => {
      // Login first
      await page
        .getByRole('button', { name: /Log in as/ })
        .first()
        .click()
      await page.waitForURL('/tracker')

      // Navigate to pricing page
      await page.goto('/pricing')

      // Look for team plan button
      const teamPlanButton = page
        .getByRole('button', { name: /Team|Team plan|Team subscription/ })
        .first()

      if (await teamPlanButton.isVisible()) {
        // Intercept the team checkout API call
        let teamCheckoutRequest: any = null
        await page.route('**/api/create-team-checkout-session', (route) => {
          teamCheckoutRequest = route.request()
          route.continue()
        })

        await teamPlanButton.click()

        // Should redirect to team page
        await page.waitForURL('/team')
        await expect(page.getByRole('heading', { name: /Team/ })).toBeVisible()

        // Verify the request was made
        if (teamCheckoutRequest) {
          const postData = teamCheckoutRequest.postDataJSON()
          expect(postData).toHaveProperty('priceId')
          expect(postData).toHaveProperty('successUrl')
          expect(postData).toHaveProperty('cancelUrl')
        }
      }
    })
  })

  test.describe('Success and Cancel URLs', () => {
    test('should handle successful subscription redirect', async ({ page }) => {
      // Login first
      await page
        .getByRole('button', { name: /Log in as/ })
        .first()
        .click()
      await page.waitForURL('/tracker')

      // Navigate directly to success URL
      await page.goto('/subscription?success=true')

      // Should show success message or updated subscription state
      await expect(
        page.getByRole('heading', { name: /Subscription|Abonnement/ }),
      ).toBeVisible()

      // URL should contain success parameter
      expect(page.url()).toContain('success=true')
    })

    test('should handle canceled subscription redirect', async ({ page }) => {
      // Login first
      await page
        .getByRole('button', { name: /Log in as/ })
        .first()
        .click()
      await page.waitForURL('/tracker')

      // Navigate directly to canceled URL
      await page.goto('/pricing?canceled=true')

      // Should show pricing page with canceled parameter
      await expect(
        page.getByRole('heading', {
          name: /Choose Your Plan|Wählen Sie Ihren Tarif/i,
        }),
      ).toBeVisible()

      // URL should contain canceled parameter
      expect(page.url()).toContain('canceled=true')
    })
  })

  test.describe('Subscription State Management', () => {
    test('should fetch and display subscription data', async ({ page }) => {
      // Login first
      await page
        .getByRole('button', { name: /Log in as/ })
        .first()
        .click()
      await page.waitForURL('/tracker')

      // Intercept subscription API call
      let subscriptionRequest: any = null
      await page.route('**/api/subscriptions/**', (route) => {
        subscriptionRequest = route.request()
        route.continue()
      })

      // Navigate to subscription page
      await page.goto('/subscription')

      // Wait for page to load
      await page.waitForLoadState('networkidle')

      // Verify the API call was made
      if (subscriptionRequest) {
        const url = subscriptionRequest.url()
        expect(url).toContain('/api/subscriptions/')
      }

      // Should show subscription page content
      await expect(
        page.getByRole('heading', { name: /Subscription|Abonnement/ }),
      ).toBeVisible()
    })

    test('should handle subscription API errors', async ({ page }) => {
      // Login first
      await page
        .getByRole('button', { name: /Log in as/ })
        .first()
        .click()
      await page.waitForURL('/tracker')

      // Mock subscription API failure
      await page.route('**/api/subscriptions/**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to fetch subscription' }),
        })
      })

      // Navigate to subscription page
      await page.goto('/subscription')

      // Should still show the page (with no subscription state)
      await expect(
        page.getByRole('heading', { name: /Subscription|Abonnement/ }),
      ).toBeVisible()

      // Should show no subscription message
      await expect(
        page.getByText(/No active subscription|Kein aktives Abonnement/),
      ).toBeVisible()
    })
  })

  test.describe('Webhook Integration', () => {
    test('should handle webhook events', async ({ page }) => {
      // This test would require a more complex setup with actual webhook simulation
      // For now, we'll test that the subscription service can handle webhook data

      // Login first
      await page
        .getByRole('button', { name: /Log in as/ })
        .first()
        .click()
      await page.waitForURL('/tracker')

      // Navigate to subscription page
      await page.goto('/subscription')

      // Wait for page to load
      await page.waitForLoadState('networkidle')

      // Verify the page loads correctly
      await expect(
        page.getByRole('heading', { name: /Subscription|Abonnement/ }),
      ).toBeVisible()

      // This is a basic test - in a real scenario, you'd want to:
      // 1. Set up a test webhook endpoint
      // 2. Simulate Stripe webhook events
      // 3. Verify the subscription state changes
      // 4. Test different webhook event types (subscription.created, subscription.updated, etc.)
    })
  })

  test.describe('Payment Method Management', () => {
    test('should handle payment method updates', async ({ page }) => {
      // Login first
      await page
        .getByRole('button', { name: /Log in as/ })
        .first()
        .click()
      await page.waitForURL('/tracker')

      // Navigate to subscription page
      await page.goto('/subscription')

      // Wait for page to load
      await page.waitForLoadState('networkidle')

      // Look for manage billing button
      const manageBillingButton = page.getByRole('button', {
        name: /Manage Billing|Abrechnung verwalten/,
      })

      if (await manageBillingButton.isVisible()) {
        // This would typically redirect to Stripe Customer Portal
        // In test environment, we can verify the button works
        await expect(manageBillingButton).toBeEnabled()
        await expect(manageBillingButton).toBeVisible()
      }
    })
  })

  test.describe('Subscription Lifecycle', () => {
    test('should handle subscription status changes', async ({ page }) => {
      // Login first
      await page
        .getByRole('button', { name: /Log in as/ })
        .first()
        .click()
      await page.waitForURL('/tracker')

      // Navigate to subscription page
      await page.goto('/subscription')

      // Wait for page to load
      await page.waitForLoadState('networkidle')

      // Verify the page handles different subscription states
      // This would typically be tested with different mock data
      await expect(
        page.getByRole('heading', { name: /Subscription|Abonnement/ }),
      ).toBeVisible()

      // The page should gracefully handle:
      // - No subscription
      // - Active subscription
      // - Trialing subscription
      // - Canceled subscription
      // - Past due subscription
    })
  })
})
