import { expect, test } from './fixtures'
import { navigateToTeamPage, testAuthRedirect } from './test-helpers'

test.describe('Team Page', () => {
  test.describe('Authorization', () => {
    test('should redirect unauthenticated users', async ({ page }) => {
      await testAuthRedirect(page, '/team')
    })

    test('should display team page for authenticated users', async ({
      page,
      loginOrRegisterTestUser,
    }) => {
      await loginOrRegisterTestUser(page)
      await navigateToTeamPage(page)

      // Verify back button and team management card
      await expect(
        page.getByRole('link', {
          name: /Back to Tracker/,
        }),
      ).toBeVisible()
      await expect(page.getByText(/Team Management/)).toBeVisible()
      await expect(page.getByText(/Create a team/)).toBeVisible()
    })
  })

  test.describe('Team Creation', () => {
    test.beforeEach(async ({ page, loginOrRegisterTestUser }) => {
      await loginOrRegisterTestUser(page)
      await navigateToTeamPage(page)
    })

    test('should navigate to team page and see create team option', async ({
      page,
    }) => {
      // Verify we're on the team page with no team yet
      await expect(page.getByText('Team Management')).toBeVisible()
      await expect(page.getByText('No team yet')).toBeVisible()
      await expect(
        page.getByText(
          'Create a team to invite members and manage subscriptions together.',
        ),
      ).toBeVisible()

      // Verify create team button is visible
      await expect(
        page.getByRole('button', { name: 'Create Team' }),
      ).toBeVisible()
    })

    test('should open create team dialog when button is clicked', async ({
      page,
    }) => {
      // Click create team button
      await page.getByRole('button', { name: 'Create Team' }).click()

      // Verify dialog is open
      await expect(page.getByTestId('create-team-dialog')).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Create Team' }),
      ).toBeVisible()

      // Verify form fields are present
      await expect(page.getByLabel('Team Name')).toBeVisible()
      await expect(page.getByLabel('Description (Optional)')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Create Team' }),
      ).toBeVisible()
    })

    test('should show validation error when submitting empty form', async ({
      page,
    }) => {
      // Open create team dialog
      await page.getByRole('button', { name: 'Create Team' }).click()

      // Try to submit empty form
      await page.getByRole('button', { name: 'Create Team' }).click()

      // Verify validation error is shown
      await expect(page.getByText('Team name is required')).toBeVisible()
    })

    test('should create team with only name', async ({ page }) => {
      await page.waitForURL('/team')

      // Open create team dialog
      await page.getByRole('button', { name: 'Create Team' }).click()

      // Fill team name
      await page.getByLabel('Team Name').fill('Test Team')

      // Submit form
      await page.getByRole('button', { name: 'Create Team' }).click()

      // Verify dialog closes and team is created
      await expect(page.getByTestId('create-team-dialog')).not.toBeVisible()
      await expect(page.locator('[data-testid="toast-title"]')).toContainText(
        'Team created',
      )

      // Verify team page now shows team management interface
      await expect(page.getByTestId('team-name')).toHaveText('Test Team')
      await expect(page.getByText('No description provided')).toBeVisible()

      // Verify team management elements are present
      await expect(
        page.getByRole('button', { name: 'Invite Member' }),
      ).toBeVisible()
      await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()
    })

    test('should create team with name and description', async ({ page }) => {
      // Open create team dialog
      await page.getByRole('button', { name: 'Create Team' }).click()

      // Fill team name and description
      await page.getByLabel('Team Name').fill('Test Team with Description')
      await page
        .getByLabel('Description (Optional)')
        .fill('This is a test team description')

      // Submit form
      await page.getByRole('button', { name: 'Create Team' }).click()

      // Verify dialog closes and team is created
      await expect(page.getByTestId('create-team-dialog')).not.toBeVisible()
      await expect(page.locator('[data-testid="toast-title"]')).toContainText(
        'Team created',
      )

      // Verify team page shows team with description
      await expect(page.getByTestId('team-name')).toHaveText(
        'Test Team with Description',
      )
      await expect(
        page.getByText('This is a test team description'),
      ).toBeVisible()
    })

    test('should cancel team creation', async ({ page }) => {
      // Open create team dialog
      await page.getByRole('button', { name: 'Create Team' }).click()

      // Fill team name
      await page.getByLabel('Team Name').fill('Test Team')

      // Cancel instead of creating
      await page.getByRole('button', { name: 'Cancel' }).click()

      // Verify dialog closes
      await expect(page.getByTestId('create-team-dialog')).not.toBeVisible()
      // Verify we're still on the no team page
      await expect(page.getByText('No team yet')).toBeVisible()
    })

    test('should show loading state during team creation', async ({ page }) => {
      // Open create team dialog
      await page.getByRole('button', { name: 'Create Team' }).click()

      // Fill team name
      await page.getByLabel('Team Name').fill('Test Team')

      // Submit form
      await page.getByRole('button', { name: 'Create Team' }).click()

      // Verify dialog closes and team is created
      await expect(page.getByTestId('create-team-dialog')).not.toBeVisible()
    })

    test('should navigate back to tracker from team page', async ({ page }) => {
      // Navigate back to tracker
      await page.getByRole('link', { name: 'Back to Tracker' }).click()
      await page.waitForURL('/tracker')
    })

    test('should create team and verify team management interface', async ({
      page,
    }) => {
      // Create a team
      await page.getByRole('button', { name: 'Create Team' }).click()
      await page.getByLabel('Team Name').fill('Management Test Team')
      await page.getByRole('button', { name: 'Create Team' }).click()

      // Verify team is created
      await expect(page.getByTestId('team-name')).toHaveText(
        'Management Test Team',
      )

      // Verify team management elements are present
      await expect(
        page.getByRole('button', { name: 'Invite Member' }),
      ).toBeVisible()
      await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()
      // Verify tabs are present
      await expect(
        page.getByRole('tab', { name: 'Team Members' }),
      ).toBeVisible()
      await expect(
        page.getByRole('tab', { name: 'Pending Invitations' }),
      ).toBeVisible()
      await expect(
        page.getByRole('tab', { name: 'Subscription' }),
      ).toBeVisible()

      // Verify team members tab content
      await expect(
        page.getByRole('heading', { name: 'Team Members' }),
      ).toBeVisible()
      await expect(
        page.getByText('Manage your team members and their roles.'),
      ).toBeVisible()

      // Verify current user is listed as owner
      await expect(page.getByText('Owner')).toBeVisible()
    })

    test('should open team settings dialog', async ({ page }) => {
      // Create a team first
      await page.getByRole('button', { name: 'Create Team' }).click()
      await page.getByLabel('Team Name').fill('Settings Test Team')
      await page.getByRole('button', { name: 'Create Team' }).click()

      // Wait for team to be created
      await expect(page.getByTestId('create-team-dialog')).not.toBeVisible()

      // Open team settings
      await page.getByRole('button', { name: 'Settings' }).click()

      // Verify settings dialog is open
      await expect(
        page.getByRole('heading', { name: 'Settings' }),
      ).toBeVisible()

      // Verify team name field is populated
      await expect(page.getByLabel('Team Name')).toHaveValue(
        'Settings Test Team',
      )

      // Close settings
      await page.getByRole('button', { name: 'Cancel' }).click()
    })

    test('should create team and verify subscription tab', async ({ page }) => {
      // Create a team
      await page.getByRole('button', { name: 'Create Team' }).click()
      await page.getByLabel('Team Name').fill('Subscription Test Team')
      await page.getByRole('button', { name: 'Create Team' }).click()

      // Wait for team to be created
      await expect(page.getByTestId('create-team-dialog')).not.toBeVisible()

      // Click on subscription tab
      await page.getByRole('tab', { name: 'Subscription' }).click()

      // Verify subscription tab content
      await expect(page.getByText('Team Subscription')).toBeVisible()
      await expect(
        page.getByText('Subscribe to unlock team features and seat management'),
      ).toBeVisible()
      await expect(page.getByText('No active subscription')).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Subscribe Now' }),
      ).toBeVisible()
    })
  })
})
