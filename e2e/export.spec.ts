import { format, getWeekOfMonth } from 'date-fns'

import { expect, test } from './fixtures'
import { addActiveSubscription } from './subscription-helpers'
import { addExportEntry, addManualEntry, navigateToMonth } from './test-helpers'

test.describe('Export Page', () => {
  let weekIndex: number = 0
  test.beforeEach(async ({ page, loginUser }) => {
    // Set up subscription mock before login to ensure it's available when the page loads
    await addActiveSubscription(page)

    await loginUser(page)
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

    const today = new Date()
    const locationName = `Export Add Entry ${Math.random().toString(36).substring(2, 15)}`
    const startTime = '10:00'
    const endTime = '12:00'

    // Use the helper to add an entry for today
    await addExportEntry(page, today, locationName, startTime, endTime)

    // Verify the new entry appears in the export preview for today
    const preview = page.locator('.printable-area')
    await expect(preview.getByText(locationName)).toBeVisible()
    await expect(preview.getByText(startTime)).toBeVisible()
    await expect(preview.getByText(endTime)).toBeVisible()
  })

  test('should exclude previous month hours from weekly totals when week spans months', async ({
    page,
  }) => {
    // Navigate to August 2025 where the first week spans July 28 - August 3
    // This is a perfect test case because August 1st is a Friday

    // First, navigate to the export page
    await page.getByRole('link', { name: 'Preview & Export' }).click()
    await page.waitForURL('/export')

    // Navigate to July 2025 to add an entry for July 31st
    await navigateToMonth(page, new Date('2025-07-01'))

    // Add entry for July 31st (Thursday - should be excluded from August weekly total)
    const julyLocationName = `July Entry ${Math.random().toString(36).substring(2, 15)}`
    await addExportEntry(
      page,
      new Date('2025-07-31'),
      julyLocationName,
      '09:00',
      '17:00',
    )

    // Navigate to August 2025
    await navigateToMonth(page, new Date('2025-08-01'))

    // Add an entry for August 1st, 2025 (Friday - should be included in August weekly total)
    const augustLocationName = `August Entry ${Math.random().toString(36).substring(2, 15)}`
    await addExportEntry(
      page,
      new Date('2025-08-01'),
      augustLocationName,
      '10:00',
      '14:00',
    )

    // Add another entry for August 2nd, 2025 (Saturday - should be included in August weekly total)
    const augustLocationName2 = `August Entry 2 ${Math.random().toString(36).substring(2, 15)}`
    await addExportEntry(
      page,
      new Date('2025-08-02'),
      augustLocationName2,
      '08:00',
      '12:00',
    )

    // Now verify the weekly totals
    const preview = page.locator('.printable-area')

    // The first week of August should only include August hours, not July hours
    // July 31st: 8 hours (should be excluded)
    // August 1st: 4 hours (should be included)
    // August 2nd: 4 hours (should be included)
    // Total for first week should be 8 hours (4 + 4), not 16 hours (8 + 4 + 4)

    await expect(preview.getByTestId('timesheet-week-0-total')).toContainText(
      '8.00',
    ) // Only August hours

    // Verify that July entry is not visible in August export
    await expect(preview.getByText(julyLocationName)).not.toBeVisible()

    // Verify that August entries are visible
    await expect(preview.getByText(augustLocationName)).toBeVisible()
    await expect(preview.getByText(augustLocationName2)).toBeVisible()

    // Verify month total includes all August entries
    await expect(preview.getByTestId('timesheet-month-total')).toContainText(
      '8.00',
    )
  })
})
