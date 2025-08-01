import { type Page, expect } from '@playwright/test'

export const GermanDateFormatString = 'd.M.yyyy'

// Helper function to create a new manual entry for the currently selected day
export const addManualEntry = async (
  page: Page,
  location: string,
  startTime: string,
  endTime: string,
) => {
  await page.getByRole('button', { name: 'Hinzufügen' }).click()
  const form = page.locator(
    'div[role="dialog"]:has(h2:has-text("Zeiteintrag hinzufügen"))',
  )
  await expect(form).toBeVisible()
  await form.getByLabel('Einsatzort').fill(location)
  await form.getByLabel('Startzeit').fill(startTime)
  await form.getByLabel('Endzeit').fill(endTime)
  await form.getByRole('button', { name: 'Eintrag speichern' }).click()
  await expect(form).not.toBeVisible()
}

// Helper function to create a new duration-only entry for the currently selected day
export const addDurationEntry = async (
  page: Page,
  location: string,
  duration: number, // in minutes
) => {
  await page.getByRole('button', { name: 'Hinzufügen' }).click()
  const form = page.locator(
    'div[role="dialog"]:has(h2:has-text("Zeiteintrag hinzufügen"))',
  )
  await expect(form).toBeVisible()
  await form.getByLabel('Einsatzort').fill(location)
  // Switch to duration mode (Radix Switch)
  await form.getByTestId('mode-switch').click()
  await form.getByLabel('Dauer (Minuten)').fill(duration.toString())
  await form.getByRole('button', { name: 'Eintrag speichern' }).click()
  await expect(form).not.toBeVisible()
}

// Helper function to login with a mock user
export const loginWithMockUser = async (page: Page) => {
  await page.goto('/login')
  await page
    .getByRole('button', { name: /Log in as/ })
    .first()
    .click()
  await page.waitForURL('/tracker')
}

// Helper function to navigate to team page and verify it loads
export const navigateToTeamPage = async (page: Page) => {
  await page.goto('/team')
  await page.waitForURL('/team')
  await expect(
    page.getByRole('heading', { name: /Team-Verwaltung/ }),
  ).toBeVisible()
}

// Helper function to test authentication redirect
export const testAuthRedirect = async (page: Page, protectedPath: string) => {
  await page.goto(protectedPath)

  // Should be redirected to login page with returnUrl parameter
  await page.waitForURL(/\/login\?returnUrl=/)

  // Verify we're on the login page
  await expect(
    page.getByRole('heading', { name: /TimeWise Tracker/ }),
  ).toBeVisible()

  // Verify the returnUrl parameter points to the protected path
  const currentUrl = page.url()
  expect(currentUrl).toContain('returnUrl=')
  expect(currentUrl).toContain(protectedPath.replace('/', ''))
}
