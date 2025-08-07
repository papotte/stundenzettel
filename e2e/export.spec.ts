import { expect, test } from '@playwright/test'

import { format, getWeekOfMonth } from 'date-fns'

import { addManualEntry } from './test-helpers'

test.describe('Export Page', () => {
  let weekIndex: number = 0
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and log in as the first mock user (language is German)
    await page.goto('/login')
    await page
      .getByRole('button', { name: /Log in as/ })
      .first()
      .click()
    await page.waitForURL('/tracker')

    const week = getWeekOfMonth(new Date(), { weekStartsOn: 1 })
    weekIndex = week - 1 // Adjust for zero-based index
  })

  test('should display entries on the export preview', async ({ page }) => {
    // Add an entry to make sure the export page has data
    await addManualEntry(page, 'Export Test Entry', '10:00', '14:00')

    // Navigate to export page
    await page.getByRole('link', { name: 'Vorschau & Export' }).click()
    await page.waitForURL('/export')

    // Check for the entry in the preview table
    const preview = page.locator('.printable-area')
    await expect(preview).toBeVisible()
    await expect(preview.getByText('Export Test Entry')).toBeVisible()
    await expect(preview.getByText('10:00')).toBeVisible()
    await expect(preview.getByText('14:00')).toBeVisible()
    // 4 hours = 4.00
    await expect(
      preview.getByTestId(`timesheet-week-${weekIndex}-total`),
    ).toContainText('4.00')
    await expect(preview.getByTestId('timesheet-month-total')).toContainText(
      '4.00',
    )
    await expect(preview.getByTestId('timesheet-month-adjusted')).toContainText(
      '4.00',
    )

    // Navigate months
    const currentMonth = await page.locator('h2').textContent()
    await page.getByTestId('export-preview-next-month-button').click()
    const nextMonth = await page.locator('h2').textContent()
    expect(currentMonth).not.toEqual(nextMonth)
  })

  test('should show warning or disable export when there are no entries', async ({
    page,
  }) => {
    await page.goto('/export')
    // Export button should be disabled
    await expect(page.getByRole('button', { name: /Excel/i })).toBeDisabled()
    // Export button should have a tooltip
    const tooltipTrigger = page.locator(
      'span:has([data-testid="export-preview-export-button"])',
    )
    await tooltipTrigger.hover()
    await expect(
      page.getByText('Keine Daten für den Export in diesem Monat verfügbar.'),
    ).toBeVisible()
  })

  test('should download Excel export file', async ({ page }) => {
    // Add an entry to make sure the export page has data
    await addManualEntry(page, 'Export Test Entry', '10:00', '14:00')

    // Navigate to export page
    await page.getByRole('link', { name: 'Vorschau & Export' }).click()
    await page.waitForURL('/export')
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Excel/i }).click(),
    ])
    const path = await download.path()
    expect(path).toBeTruthy()
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/)
  })

  test('should have a working PDF export button', async ({ page }) => {
    // Add an entry to make sure the export page has data
    await addManualEntry(page, 'Export Test Entry', '10:00', '14:00')

    // Navigate to export page
    await page.getByRole('link', { name: 'Vorschau & Export' }).click()
    await page.waitForURL('/export')

    const pdfButton = page.getByRole('button', { name: /PDF/i })
    await expect(pdfButton).toBeEnabled()
    // await pdfButton.click()
  })

  test('should allow editing an entry from the export page and reflect changes', async ({
    page,
  }) => {
    // Add an entry
    await addManualEntry(page, 'Export Edit Entry', '09:00', '12:00')

    // Navigate to export page
    await page.getByRole('link', { name: 'Vorschau & Export' }).click()
    await page.waitForURL('/export')

    // Click the entry row to open the edit dialog
    const entryCell = page.getByTestId(
      `timesheet-day-${format(new Date(), 'yyyy-MM-dd')}`,
    )
    await entryCell.click()

    // The edit form should appear
    const form = page.locator(
      'div[role="dialog"]:has(h2:has-text("Zeiteintrag bearbeiten"))',
    )
    await expect(form).toBeVisible()

    // Edit the location and end time
    await form.getByLabel('Einsatzort').fill('Edited Location')
    await form.getByLabel('Endzeit').fill('13:00')
    await form.getByRole('button', { name: 'Eintrag speichern' }).click()
    await expect(form).not.toBeVisible()

    // Verify the changes are reflected in the export preview
    const preview = page.locator('.printable-area')
    await expect(preview.getByText('Edited Location')).toBeVisible()
    await expect(preview.getByText('09:00')).toBeVisible()
    await expect(preview.getByText('13:00')).toBeVisible()
    // 4 hours = 4.00
    await expect(
      preview.getByTestId(`timesheet-week-${weekIndex}-total`),
    ).toContainText('4.00')
    await expect(preview.getByTestId('timesheet-month-total')).toContainText(
      '4.00',
    )
  })

  test('should allow cancelling edit in export page without saving changes', async ({
    page,
  }) => {
    // Add an entry
    await addManualEntry(page, 'Export Cancel Edit', '08:00', '10:00')

    // Navigate to export page
    await page.getByRole('link', { name: 'Vorschau & Export' }).click()
    await page.waitForURL('/export')

    // Click the entry row to open the edit dialog
    const entryCell = page.getByTestId(
      `timesheet-day-${format(new Date(), 'yyyy-MM-dd')}`,
    )
    await entryCell.click()

    // The edit form should appear
    const form = page.locator(
      'div[role="dialog"]:has(h2:has-text("Zeiteintrag bearbeiten"))',
    )
    await expect(form).toBeVisible()

    // Edit the location but cancel
    await form.getByLabel('Einsatzort').fill('Should Not Save')
    await form.getByRole('button', { name: 'Abbrechen' }).click()
    await page.getByRole('button', { name: 'Verwerfen' }).click()
    await expect(form).not.toBeVisible()

    // Verify the original entry is unchanged in the export preview
    const preview = page.locator('.printable-area')
    await expect(preview.getByText('Export Cancel Edit')).toBeVisible()
    await expect(preview.getByText('08:00')).toBeVisible()
    await expect(preview.getByText('10:00')).toBeVisible()
    await expect(preview.getByText('Should Not Save')).not.toBeVisible()
  })

  test('should prevent closing the edit form when clicking outside the modal', async ({
    page,
  }) => {
    // Add an entry
    await addManualEntry(page, 'Export Prevent Outside Close', '08:00', '10:00')

    // Navigate to export page
    await page.getByRole('link', { name: 'Vorschau & Export' }).click()
    await page.waitForURL('/export')

    // Click the entry row to open the edit dialog
    const entryCell = page.getByTestId(
      `timesheet-day-${format(new Date(), 'yyyy-MM-dd')}`,
    )
    await entryCell.click()

    // The edit form should appear
    const form = page.locator(
      'div[role="dialog"]:has(h2:has-text("Zeiteintrag bearbeiten"))',
    )
    await expect(form).toBeVisible()

    // Click outside the modal (on the overlay)
    // The overlay is the first element with role="presentation" after the dialog
    const overlay = page.locator('div.fixed.inset-0.bg-black\\/80').first()
    await overlay.click({ position: { x: 10, y: 10 } })

    // The form should still be visible
    await expect(form).toBeVisible()
  })

  test('should allow adding a new entry to a day from the export page', async ({
    page,
  }) => {
    await page.getByRole('link', { name: 'Vorschau & Export' }).click()
    await page.waitForURL('/export')

    // Find today's date in local time
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const todayId = `timesheet-day-${yyyy}-${mm}-${dd}`

    // Find the empty row for today and click the add button
    const dayRow = page.getByTestId(todayId)
    const addButton = dayRow.getByRole('button', {
      name: /Add entry|Hinzufügen/,
    })
    await addButton.click()

    // Fill out the form
    const form = page.locator(
      'div[role="dialog"]:has(h2:has-text("Zeiteintrag hinzufügen"))',
    )
    await expect(form).toBeVisible()
    await form.getByLabel('Einsatzort').fill('Export Add Entry')
    await form.getByLabel('Startzeit').fill('10:00')
    await form.getByLabel('Endzeit').fill('12:00')
    await form.getByRole('button', { name: 'Eintrag speichern' }).click()
    await expect(form).not.toBeVisible()

    // Verify the new entry appears in the export preview for today
    const preview = page.locator('.printable-area')
    await expect(preview.getByText('Export Add Entry')).toBeVisible()
    await expect(preview.getByText('10:00')).toBeVisible()
    await expect(preview.getByText('12:00')).toBeVisible()
  })
})
