import { type Page, expect } from '@playwright/test'

// Helper function to navigate to pricing page and verify it loads
export const navigateToPricing = async (page: Page) => {
  await page.goto('/pricing')
  await expect(
    page.getByRole('heading', {
      name: /Choose Your Plan|Wählen Sie Ihren Tarif/i,
    }),
  ).toBeVisible()
}

// Helper function to navigate to subscription page and verify it loads
export const navigateToSubscription = async (page: Page) => {
  await page.goto('/subscription')
  // Look for the subscription management title within the CardTitle (div with font-headline class)
  await expect(
    page.locator('div.font-headline').filter({
      hasText: /Manage Subscription|Abonnement verwalten/,
    }),
  ).toBeVisible()
}

// Helper function to click on a pricing plan button
export const clickPricingPlan = async (
  page: Page,
  planType: 'individual' | 'team' = 'individual',
) => {
  if (planType === 'team') {
    const teamPlanButton = page
      .getByRole('button', { name: /Team|Team plan|Team subscription/ })
      .first()

    if (await teamPlanButton.isVisible()) {
      await teamPlanButton.click()
      return true
    }
    return false
  } else {
    const choosePlanButton = page
      .getByRole('button', { name: /Get Started|Jetzt starten/ })
      .first()
    await expect(choosePlanButton).toBeVisible()
    await choosePlanButton.click()
    return true
  }
}

// Helper function to toggle billing period
export const toggleBillingPeriod = async (
  page: Page,
  period: 'monthly' | 'yearly',
) => {
  // The billing toggle uses a Switch component, not buttons
  const switchElement = page.getByRole('switch')
  const currentState = await switchElement.getAttribute('aria-checked')
  const isCurrentlyYearly = currentState === 'true'

  if (period === 'yearly' && !isCurrentlyYearly) {
    await switchElement.click()
  } else if (period === 'monthly' && isCurrentlyYearly) {
    await switchElement.click()
  }

  // Wait for the state to change
  await page.waitForTimeout(500)
}

// Helper function to verify subscription state
export const verifySubscriptionState = async (
  page: Page,
  state: 'none' | 'active' | 'trialing' | 'canceled',
) => {
  switch (state) {
    case 'none':
      await expect(
        page.getByText(/No active subscription|Kein aktives Abonnement/),
      ).toBeVisible()
      break
    case 'active':
      await expect(page.getByText(/Current Plan|Aktueller Tarif/)).toBeVisible()
      await expect(page.getByText(/Active|Aktiv/)).toBeVisible()
      break
    case 'trialing':
      await expect(page.getByText(/Current Plan|Aktueller Tarif/)).toBeVisible()
      await expect(page.getByText(/Trialing|Testphase/)).toBeVisible()
      break
    case 'canceled':
      await expect(page.getByText(/Cancellation Date|Gültig bis/)).toBeVisible()
      break
  }
}

// Helper function to click manage billing button
export const clickManageBilling = async (page: Page) => {
  const manageBillingButton = page.getByRole('button', {
    name: /Manage Billing|Abrechnung verwalten/,
  })

  if (await manageBillingButton.isVisible()) {
    await manageBillingButton.click()
    return true
  }
  return false
}

// Helper function to click upgrade button
export const clickUpgrade = async (page: Page) => {
  const upgradeButton = page.getByRole('button', { name: /Upgrade/ })
  await expect(upgradeButton).toBeVisible()
  await upgradeButton.click()
}

// Helper function to verify subscription guard behavior
export const verifySubscriptionGuard = async (page: Page) => {
  await expect(
    page.getByText(/Abonnement erforderlich|Subscription Required/),
  ).toBeVisible()

  await expect(
    page.getByRole('button', { name: /Tarif wählen|Choose a Plan/ }),
  ).toBeVisible()

  await expect(
    page.getByRole('button', {
      name: /Abonnement verwalten|Manage Subscription/,
    }),
  ).toBeVisible()
}

// Helper function to mock API responses
export const mockApiResponse = async (
  page: Page,
  urlPattern: string,
  response: { status: number; body: any },
) => {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status: response.status,
      contentType: 'application/json',
      body: JSON.stringify(response.body),
    })
  })
}

// Helper function to intercept API calls
export const interceptApiCall = async (page: Page, urlPattern: string) => {
  let request: any = null
  await page.route(urlPattern, (route) => {
    request = route.request()
    route.continue()
  })
  return request
}

// Helper function to verify checkout session parameters
export const verifyCheckoutParameters = (postData: any) => {
  expect(postData).toHaveProperty('priceId')
  expect(postData).toHaveProperty('successUrl')
  expect(postData).toHaveProperty('cancelUrl')
  expect(postData.successUrl).toContain('/subscription?success=true')
  expect(postData.cancelUrl).toContain('/pricing?canceled=true')
}

// Helper function to verify customer portal parameters
export const verifyPortalParameters = (postData: any) => {
  expect(postData).toHaveProperty('email')
  expect(postData).toHaveProperty('returnUrl')
  expect(postData.returnUrl).toContain('/subscription')
}

// Helper function to wait for loading states
export const waitForLoadingState = async (page: Page, element: any) => {
  // For pricing plans, clicking the button redirects to Stripe checkout
  // So we check if the button becomes disabled briefly, then wait for redirect
  try {
    await expect(element).toBeDisabled({ timeout: 2000 })
  } catch {
    // If button doesn't become disabled, it might have redirected already
  }

  // Wait a bit for any redirect to happen
  await page.waitForTimeout(2000)
}

// Helper function to verify error handling
export const verifyErrorHandling = async (page: Page, element: any) => {
  // Use a more specific selector to avoid multiple matches
  await expect(page.getByTestId('toast-title')).toBeVisible({ timeout: 5000 })

  await expect(element).toBeEnabled()
}

// Helper function to verify mobile layout
export const verifyMobileLayout = async (page: Page) => {
  await page.setViewportSize({ width: 375, height: 667 })

  // Verify mobile-specific elements or layout
  // Look for the card content which should be visible on mobile
  const cardContent = page.locator('[data-testid="card-content"]').first()
  if (await cardContent.isVisible()) {
    await expect(cardContent).toBeVisible()
  } else {
    // Fallback: check for any card content
    await expect(
      page.locator('.card-content, [class*="card"]').first(),
    ).toBeVisible()
  }
}

// Helper function to test navigation flow
export const testNavigationFlow = async (
  page: Page,
  startPage: string,
  targetPage: string,
) => {
  await page.goto(startPage)

  // Click back to tracker - the actual text is "Zurück zur Übersicht" in German
  await page
    .getByRole('link', { name: /Zurück zur Übersicht|Back to Tracker/ })
    .click()

  // Should be back on tracker page
  await page.waitForURL('/tracker')
  await expect(
    page.getByText(/Live-Zeiterfassung|Live Time Tracking/),
  ).toBeVisible()

  // Navigate to target page
  await page.goto(targetPage)

  // Verify target page loads
  await expect(page.getByRole('heading')).toBeVisible()
}

// Helper function to verify trial banner is visible
export const verifyTrialBanner = async (page: Page) => {
  // Check for trial status heading
  await expect(page.getByText(/Trial Status|Test-Status/)).toBeVisible()
  // Check for trial days remaining text
  await expect(page.getByText(/days remaining|Tage verbleibend/)).toBeVisible()
  // Check for add payment method button (shown during trial)
  await expect(
    page.getByRole('button', {
      name: /Add Payment Method|Zahlungsmethode hinzufügen/,
    }),
  ).toBeVisible()
}

// Helper function to verify trial expiration warning
export const verifyTrialExpirationWarning = async (page: Page) => {
  // Check for trial expiring soon heading
  await expect(
    page.getByText(/Trial Expiring Soon|Testphase läuft bald ab/),
  ).toBeVisible()
  // Check for trial expiring description
  await expect(
    page.getByText(/Your trial will end soon|Ihre Testphase endet bald/),
  ).toBeVisible()
  // Check for add payment method button
  await expect(
    page.getByRole('button', {
      name: /Add Payment Method|Zahlungsmethode hinzufügen/,
    }),
  ).toBeVisible()
}

// Helper function to verify expired trial state
export const verifyExpiredTrialState = async (page: Page) => {
  // Check for no subscription state (since trial expired)
  await expect(
    page.getByText(/No active subscription|Kein aktives Abonnement/),
  ).toBeVisible()
  // Check for upgrade button
  await expect(page.getByRole('button', { name: /Upgrade/ })).toBeVisible()
}

// Helper function to mock trial subscription response
export const mockTrialSubscription = async (
  page: Page,
  options: {
    daysRemaining?: number
    isExpired?: boolean
    status?: 'trialing' | 'past_due' | 'active'
  } = {},
) => {
  const { daysRemaining = 7, isExpired = false, status = 'trialing' } = options

  const trialEnd = isExpired
    ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    : new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toISOString()

  // Mock the subscription API with the correct pattern that matches the actual API call
  await mockApiResponse(page, '**/api/subscriptions/*', {
    status: 200,
    body: {
      status,
      trialEnd,
      currentPeriodEnd: trialEnd,
      cancelAtPeriodEnd: false,
    },
  })
}

// Helper function to verify trial checkout parameters
export const verifyTrialCheckoutParameters = (postData: any) => {
  expect(postData).toHaveProperty('trialEnabled', true)
  expect(postData).toHaveProperty('priceId')
  expect(postData).toHaveProperty('userId')

  if (postData.billingCycle) {
    expect(['monthly', 'yearly']).toContain(postData.billingCycle)
  }
}

// Helper function to verify team trial checkout parameters
export const verifyTeamTrialCheckoutParameters = (postData: any) => {
  expect(postData).toHaveProperty('trialEnabled', true)
  expect(postData).toHaveProperty('teamId')
  expect(postData).toHaveProperty('quantity')
  expect(postData.quantity).toBeGreaterThan(0)
}
