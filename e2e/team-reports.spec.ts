import { expect, test } from './fixtures'
import { navigateToTeamPage } from './test-helpers'

test.describe('Team Reports', () => {
  test('owner can open team reports and view a member report', async ({
    page,
    loginUser,
  }) => {
    // Log in as test user but stay on the team page flow
    await loginUser(page, false)

    // Navigate to the team page (no team yet)
    await navigateToTeamPage(page)

    // Create a simple team via the UI
    await page.getByRole('button', { name: 'Create Team' }).click()
    await page.getByLabel('Team Name').fill('Reports Test Team')
    await page.getByRole('button', { name: 'Create Team' }).click()

    // Wait for team management interface to appear
    await expect(page.getByTestId('team-name')).toHaveText('Reports Test Team')

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
  })
})
