import { format, getWeekOfMonth } from 'date-fns'

import { expect, test } from './fixtures'
import { addManualEntry } from './test-helpers'

test.describe('Export Page', () => {
  let weekIndex: number = 0
  test.beforeEach(async ({ page, loginOrRegisterTestUser }) => {
    await loginOrRegisterTestUser(page)
    await page.waitForURL('/tracker')

    const week = getWeekOfMonth(new Date(), { weekStartsOn: 1 })
    weekIndex = week - 1 // Adjust for zero-based index
  })

  test('should display entries on the export preview', async ({ page }) => {
    // Generate a random location name
    const locationName = `Export Test Entry ${Math.random().toString(36).substring(2, 15)}`
    const startTime = '10:00'
    const endTime = '14:00'
    // Add an entry to make sure the export page has data
    await addManualEntry(page, locationName, startTime, endTime)

    // Navigate to export page
    await page.getByRole('link', { name: 'Preview & Export' }).click()
    await page.waitForURL('/export')

    // Check for the entry in the preview table
    const preview = page.locator('.printable-area')
    await expect(preview).toBeVisible()

    await expect(preview.getByText(locationName)).toBeVisible()
    await expect(preview.getByText(startTime)).toBeVisible()
    await expect(preview.getByText(endTime)).toBeVisible()
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
      page.getByText('No data available for export in this month.'),
    ).toBeVisible()
  })

  test('should download Excel export file', async ({ page }) => {
    const locationName = `Export Test Entry ${Math.random().toString(36).substring(2, 15)}`
    const startTime = '11:00'
    const endTime = '15:00'
    // Add an entry to make sure the export page has data
    await addManualEntry(page, locationName, startTime, endTime)

    // Navigate to export page
    await page.getByRole('link', { name: 'Preview & Export' }).click()
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
    const locationName = `Export Test Entry ${Math.random().toString(36).substring(2, 15)}`
    const startTime = '12:00'
    const endTime = '16:00'
    // Add an entry to make sure the export page has data
    await addManualEntry(page, locationName, startTime, endTime)

    // Navigate to export page
    await page.getByRole('link', { name: 'Preview & Export' }).click()
    await page.waitForURL('/export')

    const pdfButton = page.getByRole('button', { name: /PDF/i })
    await expect(pdfButton).toBeEnabled()
    // await pdfButton.click()
  })

  test('should allow editing an entry from the export page and reflect changes', async ({
    page,
  }) => {
    // Add an entry
    const locationName = `Export Edit Entry ${Math.random().toString(36).substring(2, 15)}`
    const startTime = '09:00'
    const endTime = '12:00'
    await addManualEntry(page, locationName, startTime, endTime)

    // Navigate to export page
    await page.getByRole('link', { name: 'Preview & Export' }).click()
    await page.waitForURL('/export')

    // Click the entry row to open the edit dialog
    const entryCell = page.getByTestId(
      `timesheet-day-${format(new Date(), 'yyyy-MM-dd')}`,
    )
    await entryCell.click()

    // The edit form should appear
    const form = page.locator(
      'div[role="dialog"]:has(h2:has-text("Edit Time Entry"))',
    )
    await expect(form).toBeVisible()

    // Edit the location and end time
    await form
      .getByRole('textbox', { name: 'Location' })
      .fill('Edited Location')
    await form.getByLabel('End Time').fill('13:00')
    await form.getByRole('button', { name: 'Save Entry' }).click()
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
    const locationName = `Export Cancel Edit ${Math.random().toString(36).substring(2, 15)}`
    const startTime = '08:00'
    const endTime = '10:00'
    await addManualEntry(page, locationName, startTime, endTime)

    // Navigate to export page
    await page.getByRole('link', { name: 'Preview & Export' }).click()
    await page.waitForURL('/export')

    // Click the entry row to open the edit dialog
    const entryCell = page.getByTestId(
      `timesheet-day-${format(new Date(), 'yyyy-MM-dd')}`,
    )
    await entryCell.click()

    // The edit form should appear
    const form = page.locator(
      'div[role="dialog"]:has(h2:has-text("Edit Time Entry"))',
    )
    await expect(form).toBeVisible()

    // Edit the location but cancel
    await form
      .getByRole('textbox', { name: 'Location' })
      .fill('Should Not Save')
    await form.getByRole('button', { name: 'Cancel' }).click()
    await page.getByRole('button', { name: 'Discard' }).click()
    await expect(form).not.toBeVisible()

    // Verify the original entry is unchanged in the export preview
    const preview = page.locator('.printable-area')
    await expect(preview.getByText(locationName)).toBeVisible()
    await expect(preview.getByText(startTime)).toBeVisible()
    await expect(preview.getByText(endTime)).toBeVisible()
    await expect(preview.getByText('Should Not Save')).not.toBeVisible()
  })

  test('should prevent closing the edit form when clicking outside the modal', async ({
    page,
  }) => {
    // Add an entry
    const locationName = `Export Prevent Outside Close ${Math.random().toString(36).substring(2, 15)}`
    const startTime = '08:00'
    const endTime = '10:00'
    await addManualEntry(page, locationName, startTime, endTime)

    // Navigate to export page
    await page.getByRole('link', { name: 'Preview & Export' }).click()
    await page.waitForURL('/export')

    // Click the entry row to open the edit dialog
    const entryCell = page.getByTestId(
      `timesheet-day-${format(new Date(), 'yyyy-MM-dd')}`,
    )
    await entryCell.click()

    // The edit form should appear
    const form = page.locator(
      'div[role="dialog"]:has(h2:has-text("Edit Time Entry"))',
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
    await page.getByRole('link', { name: 'Preview & Export' }).click()
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
      name: /Add entry|Add/,
    })
    await addButton.click()

    // Fill out the form
    const form = page.locator(
      'div[role="dialog"]:has(h2:has-text("Add Time Entry"))',
    )
    await expect(form).toBeVisible()
    const locationName = `Export Add Entry ${Math.random().toString(36).substring(2, 15)}`
    const startTime = '10:00'
    const endTime = '12:00'
    await form.getByRole('textbox', { name: 'Location' }).fill(locationName)
    await form.getByLabel('Start Time').fill(startTime)
    await form.getByLabel('End Time').fill(endTime)
    await form.getByRole('button', { name: 'Save Entry' }).click()
    await expect(form).not.toBeVisible()

    // Verify the new entry appears in the export preview for today
    const preview = page.locator('.printable-area')
    await expect(preview.getByText(locationName)).toBeVisible()
    await expect(preview.getByText(startTime)).toBeVisible()
    await expect(preview.getByText(endTime)).toBeVisible()
  })
})
