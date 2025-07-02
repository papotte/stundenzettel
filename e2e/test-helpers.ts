import { type Page, expect } from '@playwright/test'

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
