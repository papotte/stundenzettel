import { expect, test } from '@playwright/test'

import { addDurationEntry } from './test-helpers'

test.describe('Duration Entry Form', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and log in as the first mock user (language is German)
    await page.goto('/')
    await page
      .getByRole('button', { name: /Log in as/ })
      .first()
      .click()
    await page.waitForURL('/')
  })

  test('should add, display, and delete a duration-only entry', async ({
    page,
  }) => {
    const location = 'Duration Only E2E'
    const duration = 90 // 1h 30m
    await addDurationEntry(page, location, duration)
    const entryCard = page.locator(`[data-location="${location}"]`)
    await expect(entryCard).toBeVisible()
    await expect(entryCard.getByText(/Dauer: 90 min/)).toBeVisible()
    await expect(entryCard.getByText('01:30:00')).toBeVisible()
    // Delete
    await entryCard.getByRole('button', { name: 'Löschen' }).click()
    await page.getByRole('button', { name: 'Löschen', exact: true }).click()
    await expect(entryCard).not.toBeVisible()
  })

  test('duration input increments and decrements by 5 using stepper', async ({
    page,
  }) => {
    // Go to the main page (adjust if your form is on a different route)
    await page.goto('/')

    // Open the time entry form (adjust selector as needed)
    await page.getByRole('button', { name: /Hinzufügen|Add/i }).click()
    const form = page.locator(
      'div[role="dialog"]:has(h2:has-text("Zeiteintrag hinzufügen"))',
    )
    await expect(form).toBeVisible()
    await form.getByLabel('Einsatzort').fill('Duration Stepper E2E')

    // Switch to duration mode (Radix Switch)
    await form.getByTestId('mode-switch').click()

    // Find the duration input (adjust label if needed)
    const durationInput = await page.getByLabel('Dauer (Minuten)')

    // Set initial value
    await durationInput.fill('30')
    await expect(durationInput).toHaveValue('30')

    // Simulate clicking the native stepper up button
    await durationInput.evaluate((input: HTMLInputElement) => {
      input.stepUp()
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await expect(durationInput).toHaveValue('35')

    // Simulate clicking the native stepper down button
    await durationInput.evaluate((input: HTMLInputElement) => {
      input.stepDown()
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await expect(durationInput).toHaveValue('30')
  })
})
