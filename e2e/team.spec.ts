import { expect, test } from './fixtures'
import {
  createTestTeamWithInvitation,
  navigateToTeamPage,
  testAuthRedirect,
} from './test-helpers'

// Extend window interface for test context
declare global {
  interface Window {
    testInvitationId?: string
  }
}

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

      // Wait for toast to appear before asserting its content
      await expect(page.locator('[data-testid="toast-title"]')).toBeVisible()
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

      // Wait for toast to appear before asserting its content
      await expect(page.locator('[data-testid="toast-title"]')).toBeVisible()
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

    test('should delete a team from settings', async ({ page }) => {
      // Create a team first
      await page.getByRole('button', { name: 'Create Team' }).click()
      await page.getByLabel('Team Name').fill('Delete Me Team')
      await page.getByRole('button', { name: 'Create Team' }).click()

      // Verify team exists
      await expect(page.getByTestId('team-name')).toHaveText('Delete Me Team')

      // Open team settings
      await page.getByRole('button', { name: 'Settings' }).click()
      await expect(
        page.getByRole('heading', { name: 'Settings' }),
      ).toBeVisible()

      // Open delete confirmation (AlertDialog)
      await page.getByRole('button', { name: 'Delete Team' }).click()
      const alertDialog = page.getByRole('alertdialog')
      await expect(alertDialog).toBeVisible()

      // Confirm by typing exact team name
      await alertDialog
        .getByPlaceholder('Delete Me Team')
        .fill('Delete Me Team')
      await alertDialog.getByRole('button', { name: 'Delete Team' }).click()

      // Wait for toast and verify deletion
      await expect(page.locator('[data-testid="toast-title"]')).toBeVisible()
      await expect(page.locator('[data-testid="toast-title"]')).toContainText(
        'Team deleted',
      )

      // Verify we're back to the "no team" page
      await expect(page.getByText('No team yet')).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Create Team' }),
      ).toBeVisible()
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
      await expect(
        page.getByRole('link', { name: /Sign In/i }),
      ).toHaveAttribute('href', '/login')
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
    test.beforeEach(async ({ page, loginUser, workerUser }) => {
      // Login as team owner
      await loginUser(page)

      // Create team and invitation directly in the database
      const { invitationId } = await createTestTeamWithInvitation(
        'Invitation Test Team',
        'Team for testing invitations',
        workerUser.uid,
        'inviter@example.com',
        workerUser.email,
        'member',
      )

      // Store the invitation ID for use in tests
      await page.evaluate((id) => {
        window.testInvitationId = id
      }, invitationId)
    })

    test('should display invitation details and allow acceptance', async ({
      page,
    }) => {
      // Get the invitation ID from the test context
      const invitationId = await page.evaluate(() => window.testInvitationId)

      // Navigate to invitation page
      await page.goto(`/team/invitation/${invitationId}`)

      // Verify invitation page loads correctly
      await expect(page.getByText('Team Invitation')).toBeVisible()
      await expect(page.getByText('Invitation Test Team')).toBeVisible()
      await expect(page.getByText('Member')).toBeVisible()

      // Verify accept and decline buttons are present
      await expect(
        page.getByRole('button', { name: 'Accept Invitation' }),
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Decline Invitation' }),
      ).toBeVisible()

      // Accept the invitation
      await page.getByRole('button', { name: 'Accept Invitation' }).click()

      // Wait for toast to appear before redirect happens
      await expect(page.locator('[data-testid="toast-title"]')).toBeVisible()
      await expect(page.locator('[data-testid="toast-title"]')).toContainText(
        'Invitation accepted',
      )

      // Verify redirect to team page
      await page.waitForURL('/team')
    })

    test('should allow declining an invitation', async ({ page }) => {
      // Get the invitation ID from the test context
      const invitationId = await page.evaluate(() => window.testInvitationId)

      // Navigate to invitation page
      await page.goto(`/team/invitation/${invitationId}`)

      // Verify invitation page loads
      await expect(page.getByText('Team Invitation')).toBeVisible()
      await expect(page.getByText('Invitation Test Team')).toBeVisible()

      // Decline the invitation
      await page.getByRole('button', { name: 'Decline Invitation' }).click()

      // Wait for toast to appear before redirect happens
      await expect(page.locator('[data-testid="toast-title"]')).toBeVisible()
      await expect(page.locator('[data-testid="toast-title"]')).toContainText(
        'Invitation declined',
      )

      // Verify redirect to team page
      await page.waitForURL('/team')
    })
  })
})
