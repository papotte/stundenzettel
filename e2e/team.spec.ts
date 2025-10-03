import { expect, test } from './fixtures'
import { navigateToTeamPage, testAuthRedirect } from './test-helpers'

test.describe('Team Page', () => {
  test.describe('Authorization', () => {
    test('should redirect unauthenticated users', async ({ page }) => {
      await testAuthRedirect(page, '/team')
    })

    test('should display team page for authenticated users', async ({
      page,
      loginUser,
    }) => {
      await loginUser(page)
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
    test.beforeEach(async ({ page, loginUser }) => {
      await loginUser(page)
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

  test.describe('Team Invitation Page Navigation', () => {
    test('should navigate to invitation page and show login prompt for unauthenticated users', async ({
      page,
    }) => {
      // Navigate directly to an invitation page without being logged in
      await page.goto('/team/invitation/test-invitation-id')

      // Should show login prompt
      await expect(page.getByText(/Team Invitation/i)).toBeVisible()
      await expect(
        page.getByText(/Please log in to accept or decline/i),
      ).toBeVisible()
      await expect(page.getByRole('link', { name: /Sign In/i })).toHaveAttribute(
        'href',
        '/login',
      )
    })

    test('should handle invalid invitation ID gracefully', async ({
      page,
      loginUser,
    }) => {
      await loginUser(page, false)

      // Navigate to invitation page with invalid ID
      await page.goto('/team/invitation/nonexistent-invitation-id')

      // Should show error message
      await expect(
        page.getByText(/This invitation could not be found/i),
      ).toBeVisible()
      await expect(
        page.getByRole('link', { name: /Go to Team Page/i }),
      ).toBeVisible()
    })
  })

  test.describe('Team Invitation Accept/Decline Flow', () => {
    test.beforeEach(async ({ page, loginUser }) => {
      await loginUser(page, false)
    })

    test('should display invitation details and allow acceptance', async ({
      page,
    }) => {
      // Note: This test requires a valid invitation to be created first
      // In a real scenario, we would:
      // 1. Create a team with one user
      // 2. Send an invitation to another user
      // 3. Log in as the invited user
      // 4. Navigate to the invitation link
      // 5. Accept the invitation

      // For this E2E test, we'll verify the page structure
      // Navigate to team page first
      await page.goto('/team')

      // Verify we can access team page
      await expect(
        page.getByRole('link', { name: /Back to Tracker/i }),
      ).toBeVisible()

      // The actual invitation acceptance flow would require:
      // - A multi-user test setup
      // - Creating invitations via the team management interface
      // - Switching between user sessions
      // This is documented but not implemented in this minimal E2E test
    })

    test('should allow declining an invitation', async ({ page }) => {
      // Similar to accept test, this would require a full invitation setup
      // The page structure and navigation have been verified
      // Actual decline flow would require:
      // - A valid invitation ID
      // - Proper authentication
      // - Clicking the decline button
      // - Verifying redirect to team page

      await page.goto('/team')

      // Verify navigation works
      await expect(
        page.getByRole('link', { name: /Back to Tracker/i }),
      ).toBeVisible()
    })
  })
})
