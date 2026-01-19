import { expect, test } from '@playwright/test'

test.describe('Landing Page Routing', () => {
  test('should load the start page (/)', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('heading', {
        name: /Effortless Time Tracking/i,
        level: 1,
      }),
    ).toBeVisible()
    await expect(page.getByTestId('footer')).toBeVisible()
    await expect(page.getByTestId('top-nav')).toBeVisible()
    await expect(page.getByTestId('login-link')).toBeVisible()
  })

  test('should load the pricing page', async ({ page }) => {
    await page.goto('/pricing')
    await expect(
      page.getByRole('heading', {
        name: /Choose Your Plan/i,
      }),
    ).toBeVisible()
    await expect(page.getByTestId('footer')).toBeVisible()
    await expect(page.getByTestId('top-nav')).toBeVisible()
    await expect(page.getByTestId('login-link')).toBeVisible()
  })
})
