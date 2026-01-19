import { expect, test } from './fixtures'
import {
  createTestTeamWithInvitation,
  navigateToTeamPage,
} from './test-helpers'

test.describe('Team Page', () => {
  test.describe('Team Creation', () => {
    test.beforeEach(async ({ page, loginUser }) => {
      await loginUser(page)
      await navigateToTeamPage(page)
    })

    test('should create team and verify management UI', async ({ page }) => {
      await page.getByRole('button', { name: 'Create Team' }).click()
      await page.getByLabel('Team Name').fill('E2E Test Team')
      await page
        .getByLabel('Description (Optional)')
        .fill('Team for e2e management UI checks')
      await page.getByRole('button', { name: 'Create Team' }).click()

      await expect(page.getByTestId('create-team-dialog')).not.toBeVisible()
      await expect(page.locator('[data-testid="toast-title"]')).toContainText(
        'Team created',
      )

      await expect(page.getByTestId('team-name')).toHaveText('E2E Test Team')
      await expect(
        page.getByText('Team for e2e management UI checks'),
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Invite Member' }),
      ).toBeVisible()
      await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()

      await expect(
        page.getByRole('tab', { name: 'Team Members' }),
      ).toBeVisible()
      await expect(
        page.getByRole('tab', { name: 'Pending Invitations' }),
      ).toBeVisible()
      await expect(
        page.getByRole('tab', { name: 'Subscription' }),
      ).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Team Members' }),
      ).toBeVisible()
      await expect(
        page.getByText('Manage your team members and their roles.'),
      ).toBeVisible()
      await expect(page.getByText('Owner')).toBeVisible()

      await page.getByRole('tab', { name: 'Subscription' }).click()
      await expect(page.getByText('Team Subscription')).toBeVisible()
      await expect(
        page.getByText('Subscribe to unlock team features and seat management'),
      ).toBeVisible()
      await expect(page.getByText('No active subscription')).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Subscribe Now' }),
      ).toBeVisible()
    })

    test('should show validation when submitting empty form and allow cancelling', async ({
      page,
    }) => {
      await page.getByRole('button', { name: 'Create Team' }).click()
      await expect(page.getByTestId('create-team-dialog')).toBeVisible()

      // Submit empty → validation blocks creation
      await page
        .getByTestId('create-team-dialog')
        .getByRole('button', { name: 'Create Team' })
        .click()
      await expect(page.getByText('Team name is required')).toBeVisible()

      // Fill and cancel → dialog closes, no team created
      await page.getByLabel('Team Name').fill('Test Team')
      await page.getByRole('button', { name: 'Cancel' }).click()

      await expect(page.getByTestId('create-team-dialog')).not.toBeVisible()
      await expect(page.getByText('No team yet')).toBeVisible()
    })
  })

  test.describe('Team Management', () => {
    test.beforeEach(async ({ page, loginUser }) => {
      await loginUser(page)
      await navigateToTeamPage(page)
    })

    test('should delete a team from settings', async ({ page }) => {
      // Create a team first
      await page.getByRole('button', { name: 'Create Team' }).click()
      await page.getByLabel('Team Name').fill('Delete Me Team')
      await page.getByRole('button', { name: 'Create Team' }).click()

      await expect(page.getByTestId('team-name')).toHaveText('Delete Me Team')

      await page.getByRole('button', { name: 'Settings' }).click()
      await expect(
        page.getByRole('heading', { name: 'Settings' }),
      ).toBeVisible()
      await expect(page.getByLabel('Team Name')).toHaveValue('Delete Me Team')
      await page.getByRole('button', { name: 'Delete Team' }).click()
      const alertDialog = page.getByRole('alertdialog')
      await expect(alertDialog).toBeVisible()

      await alertDialog
        .getByPlaceholder('Delete Me Team')
        .fill('Delete Me Team')
      await alertDialog.getByRole('button', { name: 'Delete Team' }).click()

      await expect(page.locator('[data-testid="toast-title"]')).toBeVisible()
      await expect(page.locator('[data-testid="toast-title"]')).toContainText(
        'Team deleted',
      )

      await expect(page.getByText('No team yet')).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Create Team' }),
      ).toBeVisible()
    })
  })

  test.describe('Team Invitations', () => {
    test('should accept and decline an invitation', async ({
      page,
      loginUser,
      workerUser,
    }) => {
      await loginUser(page)

      const { invitationId: acceptId } = await createTestTeamWithInvitation(
        'Accept Test Team',
        'For accept flow',
        workerUser.uid,
        workerUser.email,
        workerUser.email,
        'member',
      )
      const { invitationId: declineId } = await createTestTeamWithInvitation(
        'Decline Test Team',
        'For decline flow',
        workerUser.uid,
        workerUser.email,
        workerUser.email,
        'member',
      )

      // Accept flow
      await page.goto(`/team/invitation/${acceptId}`)
      await expect(page.getByText('Team Invitation')).toBeVisible()
      await expect(page.getByText('Accept Test Team')).toBeVisible()
      await expect(page.getByText('Member')).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Accept Invitation' }),
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Decline Invitation' }),
      ).toBeVisible()
      await page.getByRole('button', { name: 'Accept Invitation' }).click()
      await expect(page.locator('[data-testid="toast-title"]')).toContainText(
        'Invitation accepted',
      )
      await page.waitForURL('/team')

      // Decline flow
      await page.goto(`/team/invitation/${declineId}`)
      await expect(page.getByText('Team Invitation')).toBeVisible()
      await expect(page.getByText('Decline Test Team')).toBeVisible()
      await page.getByRole('button', { name: 'Decline Invitation' }).click()
      await expect(page.locator('[data-testid="toast-title"]')).toContainText(
        'Invitation declined',
      )
      await page.waitForURL('/team')
    })
  })
})
