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

  test('should display entries, allow Excel download, and navigate months', async ({
    page,
  }) => {
    const locationName = `Export ${Math.random().toString(36).substring(2, 10)}`
    await addManualEntry(page, locationName, '10:00', '14:00')

    await page.getByRole('link', { name: 'Preview & Export' }).click()
    await page.waitForURL('/export')
    await expect(page.getByTestId('export-preview-card')).toBeVisible()

    const preview = page.locator('.printable-area')
    await expect(preview).toBeVisible()
    await expect(preview.getByText(locationName)).toBeVisible()
    await expect(preview.getByText('10:00')).toBeVisible()
    await expect(preview.getByText('14:00')).toBeVisible()
    await expect(
      preview.getByTestId(`timesheet-week-${weekIndex}-total`),
    ).toContainText('4.00')
    await expect(preview.getByTestId('timesheet-month-total')).toContainText(
      '4.00',
    )
    await expect(preview.getByTestId('timesheet-month-adjusted')).toContainText(
      '4.00',
    )

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-preview-export-button').click(),
    ])
    expect(await download.path()).toBeTruthy()
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/)

    const currentMonth = await page.locator('h2').textContent()
    await page.getByTestId('export-preview-next-month-button').click()
    const nextMonth = await page.locator('h2').textContent()
    expect(currentMonth).not.toEqual(nextMonth)
  })

  test('should allow editing an entry from the export page and reflect changes', async ({
    page,
  }) => {
    const locationName = `Edit Export ${Math.random().toString(36).substring(2, 10)}`
    await addManualEntry(page, locationName, '09:00', '12:00')

    await page.getByRole('link', { name: 'Preview & Export' }).click()
    await page.waitForURL('/export')

    const entryCell = page.getByTestId(
      `timesheet-day-${format(new Date(), 'yyyy-MM-dd')}`,
    )
    await entryCell.click()

    const form = page.locator(
      'div[role="dialog"]:has(h2:has-text("Edit Time Entry"))',
    )
    await expect(form).toBeVisible()
    await form
      .getByRole('textbox', { name: 'Location' })
      .fill('Edited Location')
    await form.getByLabel('End Time').fill('13:00')
    await form.getByRole('button', { name: 'Save Entry' }).click()
    await expect(form).not.toBeVisible()

    const preview = page.locator('.printable-area')
    await expect(preview.getByText('Edited Location')).toBeVisible()
    await expect(preview.getByText('09:00')).toBeVisible()
    await expect(preview.getByText('13:00')).toBeVisible()
    await expect(
      preview.getByTestId(`timesheet-week-${weekIndex}-total`),
    ).toContainText('4.00')
    await expect(preview.getByTestId('timesheet-month-total')).toContainText(
      '4.00',
    )
  })

  test('should allow adding an entry from the export page', async ({
    page,
  }) => {
    await page.getByRole('link', { name: 'Preview & Export' }).click()
    await page.waitForURL('/export')

    const today = new Date()
    const locationName = `Add Export ${Math.random().toString(36).substring(2, 10)}`
    await addExportEntry(page, today, locationName, '10:00', '12:00')

    const preview = page.locator('.printable-area')
    await expect(preview.getByText(locationName)).toBeVisible()
    await expect(preview.getByText('10:00')).toBeVisible()
    await expect(preview.getByText('12:00')).toBeVisible()
  })

  test('should exclude previous month hours from weekly totals when week spans months', async ({
    page,
  }) => {
    await page.getByRole('link', { name: 'Preview & Export' }).click()
    await page.waitForURL('/export')

    await navigateToMonth(page, new Date('2025-07-01'))
    const julyLocation = `July ${Math.random().toString(36).substring(2, 10)}`
    await addExportEntry(
      page,
      new Date('2025-07-31'),
      julyLocation,
      '09:00',
      '17:00',
    )

    await navigateToMonth(page, new Date('2025-08-01'))
    const august1 = `Aug1 ${Math.random().toString(36).substring(2, 10)}`
    await addExportEntry(
      page,
      new Date('2025-08-01'),
      august1,
      '10:00',
      '14:00',
    )
    const august2 = `Aug2 ${Math.random().toString(36).substring(2, 10)}`
    await addExportEntry(
      page,
      new Date('2025-08-02'),
      august2,
      '08:00',
      '12:00',
    )

    const preview = page.locator('.printable-area')
    await expect(preview.getByTestId('timesheet-week-0-total')).toContainText(
      '8.00',
    )
    await expect(preview.getByText(julyLocation)).not.toBeVisible()
    await expect(preview.getByText(august1)).toBeVisible()
    await expect(preview.getByText(august2)).toBeVisible()
    await expect(preview.getByTestId('timesheet-month-total')).toContainText(
      '8.00',
    )
  })
})
