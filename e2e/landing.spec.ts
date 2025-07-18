import { expect, test } from '@playwright/test'

test.describe('Landing Page Routing', () => {
  test('should load the start page (/)', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('heading', {
        name: /Mühelose Zeiterfassung|Effortless Time Tracking/i,
        level: 1,
      }),
    ).toBeVisible()
    await expect(page.getByTestId('footer')).toBeVisible()
    await expect(page.getByTestId('top-nav')).toBeVisible()
    await expect(page.getByTestId('login-link')).toBeVisible()
  })

  test('should load the features page', async ({ page }) => {
    await page.goto('/features')
    // Check that an h2 exists (since the main heading is h2)
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible()
    // Check that the features container is present
    await expect(page.getByTestId('features-container')).toBeVisible()
    // Optionally, check that at least one feature is listed
    await expect(
      page.getByText(/Live Time Tracking|Live-Zeiterfassung/i),
    ).toBeVisible()
    await expect(page.getByTestId('footer')).toBeVisible()
    await expect(page.getByTestId('top-nav')).toBeVisible()
    await expect(page.getByTestId('login-link')).toBeVisible()
  })

  test('should load the pricing page', async ({ page }) => {
    await page.goto('/pricing')
    await expect(
      page.getByRole('heading', {
        name: /Choose Your Plan|Wählen Sie Ihren Tarif/i,
      }),
    ).toBeVisible()
    await expect(page.getByTestId('footer')).toBeVisible()
    await expect(page.getByTestId('top-nav')).toBeVisible()
    await expect(page.getByTestId('login-link')).toBeVisible()
  })

  test('should load the terms page', async ({ page }) => {
    await page.goto('/terms')
    await expect(
      page.getByRole('heading', {
        name: /Terms and Conditions|Nutzungsbedingungen/i,
        level: 1,
      }),
    ).toBeVisible()
    await expect(page.getByTestId('footer')).toBeVisible()
    await expect(page.getByTestId('top-nav')).toBeVisible()
    await expect(page.getByTestId('login-link')).toBeVisible()
  })

  test('should load the privacy page', async ({ page }) => {
    await page.goto('/privacy')
    await expect(
      page.getByRole('heading', { name: /Privacy|Datenschutz/i, level: 1 }),
    ).toBeVisible()
    await expect(page.getByTestId('footer')).toBeVisible()
    await expect(page.getByTestId('top-nav')).toBeVisible()
    await expect(page.getByTestId('login-link')).toBeVisible()
  })

  test('should load the imprint page', async ({ page }) => {
    await page.goto('/imprint')
    await expect(
      page.getByRole('heading', { name: /Imprint|Impressum/i, level: 1 }),
    ).toBeVisible()
    await expect(page.getByTestId('footer')).toBeVisible()
    await expect(page.getByTestId('top-nav')).toBeVisible()
    await expect(page.getByTestId('login-link')).toBeVisible()
  })

  test('should load the cookies page', async ({ page }) => {
    await page.goto('/cookies')
    await expect(
      page.getByRole('heading', {
        name: /Cookie Policy|Cookie-Richtlinien/i,
        level: 1,
      }),
    ).toBeVisible()
    await expect(page.getByTestId('footer')).toBeVisible()
    await expect(page.getByTestId('top-nav')).toBeVisible()
    await expect(page.getByTestId('login-link')).toBeVisible()
  })
})
