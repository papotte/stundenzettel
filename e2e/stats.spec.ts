import { expect, test } from './fixtures'
import { addActiveSubscription } from './subscription-helpers'
import { addManualEntry } from './test-helpers'

test.describe('Stats Page', () => {
  test.beforeEach(async ({ page, loginUser }) => {
    await addActiveSubscription(page)
    await loginUser(page)
    await page.waitForURL('/tracker')

    // Add manual entries for today so stats has data for "This month" / "This week"
    await addManualEntry(page, 'Stats Project A', '09:00', '12:00')
    await addManualEntry(page, 'Stats Project B', '13:00', '17:00')
  })

  test('should render stats and show totals that change when time range is changed', async ({
    page,
  }) => {
    await page.getByRole('link', { name: 'Stats' }).click()
    await page.waitForURL('/stats')

    await expect(
      page.getByRole('heading', { name: 'Stats', level: 1 }),
    ).toBeVisible()
    const summarySection = page.getByRole('region', { name: 'Summary' })
    await expect(summarySection.getByText('Total hours')).toBeVisible()

    const periodSelect = page.getByRole('combobox', { name: 'Stats' })
    await expect(periodSelect).toContainText('This month')

    // Total hours row: target the dd that follows the "Total hours" dt (Summary can show Expected hours first)
    const totalHoursValue = summarySection
      .locator('dt', { hasText: 'Total hours' })
      .locator('xpath=following-sibling::dd[1]')
    await expect(totalHoursValue).toBeVisible()
    // 7.0 h from the two entries added in beforeEach (3h + 4h)
    await expect(totalHoursValue).toContainText('7.0')

    const statsTable = page.getByRole('table')
    await expect(statsTable).toBeVisible()
    await expect(
      statsTable.getByRole('cell', { name: 'Stats Project A' }),
    ).toBeVisible()
    await expect(
      statsTable.getByRole('cell', { name: 'Stats Project B' }),
    ).toBeVisible()

    // Switch to "This week" – same entries (today is in this week), total unchanged
    await periodSelect.click()
    await page.getByRole('option', { name: 'This week' }).click()
    await expect(periodSelect).toContainText('This week')
    await expect(totalHoursValue).toContainText('7.0')
    await expect(
      statsTable.getByRole('cell', { name: 'Stats Project A' }),
    ).toBeVisible()

    // Switch to "Last week" – no entries, total becomes 0.0
    await periodSelect.click()
    await page.getByRole('option', { name: 'Last week' }).click()
    await expect(periodSelect).toContainText('Last week')
    await expect(totalHoursValue).toContainText('0.0')
    await expect(page.getByText('No entries in this period')).toBeVisible()

    // Switch back to "This month" – entries and total back
    await periodSelect.click()
    await page.getByRole('option', { name: 'This month' }).click()
    await expect(periodSelect).toContainText('This month')
    await expect(totalHoursValue).toContainText('7.0')
    await expect(
      statsTable.getByRole('cell', { name: 'Stats Project A' }),
    ).toBeVisible()
    await expect(
      statsTable.getByRole('cell', { name: 'Stats Project B' }),
    ).toBeVisible()
  })
})
