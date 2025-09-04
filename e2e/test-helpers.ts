import { type Page, expect } from '@playwright/test'

// Helper function to create a new manual entry for the currently selected day
export const addManualEntry = async (
  page: Page,
  location: string,
  startTime: string,
  endTime: string,
) => {
  await page.getByRole('button', { name: 'Add' }).first().click()
  const form = page.locator(
    'div[role="dialog"]:has(h2:has-text("Add Time Entry"))',
  )
  await expect(form).toBeVisible()
  await form.getByRole('textbox', { name: 'Location' }).fill(location)
  await form.getByLabel('Start Time').fill(startTime)
  await form.getByLabel('End Time').fill(endTime)
  await form.getByRole('button', { name: 'Save Entry' }).click()
  await expect(form).not.toBeVisible()
}

// Helper function to create a new duration-only entry for the currently selected day
export const addDurationEntry = async (
  page: Page,
  location: string,
  duration: number, // in minutes
) => {
  await page.getByRole('button', { name: 'Add' }).first().click()
  const form = page.locator(
    'div[role="dialog"]:has(h2:has-text("Add Time Entry"))',
  )
  await expect(form).toBeVisible()
  await form.getByRole('textbox', { name: 'Location' }).fill(location)
  // Switch to duration mode (Radix Switch)
  await form.getByTestId('mode-switch').click()
  await form.getByLabel('Duration (minutes)').fill(duration.toString())
  await form.getByRole('button', { name: 'Save Entry' }).click()
  await expect(form).not.toBeVisible()
}

// Helper function to navigate to team page and verify it loads
export const navigateToTeamPage = async (page: Page) => {
  await page.goto('/team')
  await page.waitForURL('/team')
  await expect(
    page.getByRole('heading', { name: /Team Management/ }),
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
