import { format } from 'date-fns'

import { expect, test } from './fixtures'
import { addActiveSubscription } from './subscription-helpers'
import { addExportEntry, createTestTeam } from './test-helpers'

const TEAM_NAME = 'Reports Test Team'

test.describe('Team Reports', () => {
  test.beforeEach(async ({ page, workerUser, loginUser }) => {
    await addActiveSubscription(page)
    await loginUser(page, false)
    await createTestTeam(TEAM_NAME, workerUser.uid, workerUser.email)
  })

  test('owner can open team reports and open member report dialog (not published)', async ({
    page,
  }) => {
    await page.goto('/team')
    await page.waitForURL('/team')
    await expect(page.getByTestId('team-name')).toHaveText(TEAM_NAME)

    // Open the Reports tab (visible for owner/admin)
    await page.getByRole('tab', { name: 'Reports' }).click()

    // Verify the reports header and month selector are visible
    await expect(
      page.getByRole('heading', { name: 'Team Reports' }),
    ).toBeVisible()
    await expect(page.getByTestId('reports-month')).toBeVisible()

    // There should be at least one member card (the owner) in the reports grid
    const memberCard = page.locator('[data-testid^="member-card-"]').first()
    await expect(memberCard).toBeVisible()

    // Clicking the member card opens the read-only member report dialog
    await memberCard.click()

    await expect(page.getByTestId('member-report-view-card')).toBeVisible()
    await expect(page.getByTestId('member-report-view-card')).toContainText(
      'This month has not been published by the member',
    )
  })

  test('owner can publish report, verify in team reports, update and verify changes', async ({
    page,
  }) => {
    await page.goto('/tracker')
    await page.waitForURL('/tracker')

    const today = new Date()
    const dateForEntry =
      today.getDay() === 0
        ? (() => {
            const d = new Date(today)
            d.setDate(d.getDate() + 1)
            return d
          })()
        : today

    const locationName = `Publish E2E ${Math.random().toString(36).substring(2, 10)}`

    await page.getByRole('link', { name: 'Preview & Export' }).click()
    await page.waitForURL('/export')

    await addExportEntry(page, dateForEntry, locationName, '10:00', '14:00')

    await page.getByTestId('export-preview-publish-button').click()
    await expect(page.getByTestId('export-preview-published-on')).toBeVisible({
      timeout: 5000,
    })

    await page.goto('/team')
    await page.waitForURL('/team')
    await expect(page.getByTestId('team-name')).toHaveText(TEAM_NAME)
    await page.getByRole('tab', { name: 'Reports' }).click()

    const memberCard = page.locator('[data-testid^="member-card-"]').first()
    await expect(memberCard).toBeVisible()
    await expect(memberCard).toContainText('4.00')
    await expect(memberCard).not.toContainText(
      /Not published|nicht veröffentlicht/i,
    )

    await memberCard.click()
    await expect(page.getByTestId('member-report-view-card')).toBeVisible()
    await expect(page.locator('.printable-area')).toContainText(locationName)

    await page.keyboard.press('Escape')

    await page.getByRole('link', { name: 'Preview & Export' }).click()
    await page.waitForURL('/export')

    const entryCell = page.getByTestId(
      `timesheet-day-${format(dateForEntry, 'yyyy-MM-dd')}`,
    )
    await entryCell.first().click()

    const form = page.locator(
      'div[role="dialog"]:has(h2:has-text("Edit Time Entry"))',
    )
    await expect(form).toBeVisible()
    const editedLocation = `Edited ${locationName}`
    await form.getByRole('textbox', { name: 'Location' }).fill(editedLocation)
    await form.getByRole('button', { name: 'Save Entry' }).click()
    await expect(form).not.toBeVisible()

    await page.getByTestId('export-preview-publish-button').click()
    await page.getByTestId('export-preview-publish-overwrite-confirm').click()
    await expect(page.getByTestId('export-preview-published-on')).toBeVisible({
      timeout: 5000,
    })

    await page.goto('/team')
    await page.waitForURL('/team')
    await page.getByRole('tab', { name: 'Reports' }).click()

    const memberCardAfter = page
      .locator('[data-testid^="member-card-"]')
      .first()
    await expect(memberCardAfter).toBeVisible()
    await memberCardAfter.click()

    await expect(page.getByTestId('member-report-view-card')).toBeVisible()
    await expect(page.locator('.printable-area')).toContainText(editedLocation)
  })
})
