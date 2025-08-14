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

  test.describe('Team Preferences Advanced Features', () => {
    test.beforeEach(async ({ page }) => {
      await loginWithMockUser(page)
      await navigateToTeamPage(page)

      // Create a team first
      await page.getByRole('button', { name: 'Team erstellen' }).click()
      await page.getByLabel('Team-Name').fill('Advanced Preferences Team')
      await page.getByRole('button', { name: 'Team erstellen' }).click()
      await expect(page.getByTestId('create-team-dialog')).not.toBeVisible()
    })

    test('should open team settings and navigate between tabs', async ({ page }) => {
      // Open team settings
      await page.getByRole('button', { name: 'Einstellungen' }).click()

      // Verify dialog is open with Basic tab active
      await expect(
        page.getByRole('heading', { name: 'Einstellungen' }),
      ).toBeVisible()
      await expect(page.getByLabel('Team-Name')).toHaveValue(
        'Advanced Settings Team',
)
      // Navigate to Team Settings tab
      await page.getByRole('tab', { name: 'Team-Einstellungen' }).click()

      // Verify Team Settings tab content
      await expect(page.getByText('Export-Format')).toBeVisible()
      await expect(page.getByText('Kompensations-Split aktivieren')).toBeVisible()

      // Navigate to Info tab
      await page.getByRole('tab', { name: 'Info' }).click()

      // Verify Info tab content (Team ID should be visible)
      await expect(page.getByText('Team-ID')).toBeVisible()
    })

    test('should configure compensation split settings', async ({ page }) => {
      // Navigate to team page and open preferences tab
      await page.goto('/team')
      await page.waitForURL('/team')

      const preferencesTab = page.getByRole('tab', { name: 'Konfiguration' })
      await preferencesTab.click()

      // Verify compensation split is enabled by default
      const splitCheckbox = page.getByRole('checkbox', {
        name: /Compensation Split|Vergütungsaufteilung aktivieren/,
      })
      await expect(splitCheckbox).toBeChecked()

      // Should see driver and passenger fields
      await expect(page.getByLabel(/Default Driver Compensation|Standard-Fahrer-Vergütung/)).toBeVisible()
      await expect(page.getByLabel(/Default Passenger Compensation|Standard-Beifahrer-Vergütung/)).toBeVisible()

      // Set compensation percentages
      await page.getByLabel(/Default Driver Compensation|Standard-Fahrer-Vergütung/).fill('95')
      await page.getByLabel(/Default Passenger Compensation|Standard-Beifahrer-Vergütung/).fill('85')

      // Save compensation settings
      const compensationCard = page.locator('div:has-text("Compensation Defaults")').first()
      await compensationCard.getByRole('button', { name: 'Save|Speichern' }).click()

      // Verify settings are saved (success message should appear)
      await expect(page.getByText(/Settings saved|Einstellungen gespeichert/)).toBeVisible()
    })

    test('should toggle to unified compensation mode', async ({ page }) => {
      // Open team settings and go to Team Settings tab
      await page.getByRole('button', { name: 'Einstellungen' }).click()
      await page.getByRole('tab', { name: 'Team-Einstellungen' }).click()

      // Disable compensation split
      const splitCheckbox = page.getByRole('checkbox', {
        name: /Kompensations-Split aktivieren/,
      })
      await splitCheckbox.uncheck()

      // Should now see unified compensation field
      await expect(page.getByLabel('Kompensationsrate (%)')).toBeVisible()
      await expect(page.getByLabel('Fahrer-Kompensation (%)')).not.toBeVisible()
      await expect(
        page.getByLabel('Beifahrer-Kompensation (%)'),
      ).not.toBeVisible()
      // Set unified compensation rate
      await page.getByLabel('Kompensationsrate (%)').fill('90')

      // Save settings
      await page.getByRole('button', { name: 'Speichern' }).click()

      // Verify settings are saved
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test('should configure export format settings', async ({ page }) => {
      // Open team settings and go to Team Settings tab
      await page.getByRole('button', { name: 'Einstellungen' }).click()
      await page.getByRole('tab', { name: 'Team-Einstellungen' }).click()

      // Configure export format
      await page.getByRole('combobox', { name: /Export-Format/ }).click()
      await page.getByRole('option', { name: 'PDF' }).click()

      // Configure export fields
      await page.getByRole('checkbox', { name: /Standort einbeziehen/ }).check()
      await page
        .getByRole('checkbox', { name: /Pausendauer einbeziehen/ })
        .check()
      // Save settings
      await page.getByRole('button', { name: 'Speichern' }).click()

      // Verify settings are saved
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test('should configure company details', async ({ page }) => {
      // Open team settings and go to Team Settings tab
      await page.getByRole('button', { name: 'Einstellungen' }).click()
      await page.getByRole('tab', { name: 'Team-Einstellungen' }).click()

      // Fill company details
      await page.getByLabel('Firmenname').fill('Test Company GmbH')
      await page.getByLabel('Firmen-E-Mail').fill('contact@testcompany.de')
      await page.getByLabel('Telefon 1').fill('+49 123 456789')

      // Save settings
      await page.getByRole('button', { name: 'Speichern' }).click()

      // Verify settings are saved
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test('should configure override permissions', async ({ page }) => {
      // Open team settings and go to Team Settings tab
      await page.getByRole('button', { name: 'Einstellungen' }).click()
      await page.getByRole('tab', { name: 'Team-Einstellungen' }).click()

      // Configure override permissions
      await page
        .getByRole('checkbox', {
          name: /Mitgliedern erlauben, Kompensation zu überschreiben/,
        })
        .uncheck()
      await page
        .getByRole('checkbox', {
          name: /Mitgliedern erlauben, Export-Einstellungen zu überschreiben/,
        })
        .check()
      await page
        .getByRole('checkbox', {
          name: /Mitgliedern erlauben, Arbeitszeiten zu überschreiben/,
        })
        .uncheck()
      // Save settings
      await page.getByRole('button', { name: 'Speichern' }).click()

      // Verify settings are saved
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test('should verify team settings affect company page', async ({
      page,
    }) => {
      // Configure team settings first
      await page.getByRole('button', { name: 'Einstellungen' }).click()
      await page.getByRole('tab', { name: 'Konfiguration' }).click()

      // Disable compensation split and set unified rate
      await page
        .getByRole('checkbox', { name: /Kompensations-Split aktivieren/ })
        .uncheck()
      await page.getByLabel('Kompensationsrate (%)').fill('88')

      // Disable compensation override permission
      await page
        .getByRole('checkbox', {
          name: /Mitgliedern erlauben, Kompensation zu überschreiben/,
        })
        .uncheck()
      // Set company details
      await page.getByLabel('Firmenname').fill('Team Company Ltd')

      // Save settings
      await page.getByRole('button', { name: 'Speichern' }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible()

      // Navigate to company settings page
      await page.goto('/company')

      // Verify team settings are applied
      const companyNameInput = page.getByRole('textbox', { name: /Company name|Firmenname/ })
      const compensationRateInput = page.getByRole('spinbutton', { name: /Kompensationsrate/ })
      await expect(companyNameInput).toHaveValue('Team Company Ltd')
      await expect(page.getByText('Kompensationsrate')).toBeVisible() // Unified field
      await expect(compensationRateInput).toHaveValue('88')

      // Verify compensation field is disabled (no override permission)
      const compensationInput = page.getByRole('spinbutton', {
        name: /Kompensationsrate/,
      })
      await expect(compensationInput).toBeDisabled()

      // Verify team control message is shown
      await expect(
        page.getByText('Diese Einstellung wird von Ihrem Team kontrolliert'),
      ).toBeVisible()
    })

    test('should handle team settings errors gracefully', async ({ page }) => {
      // Open team settings
      await page.getByRole('button', { name: 'Einstellungen' }).click()
      await page.getByRole('tab', { name: 'Team-Einstellungen' }).click()

      // Try to save invalid data (this test assumes validation exists)
      await page.getByLabel('Fahrer-Kompensation (%)').fill('-10') // Invalid negative value

      // Attempt to save
      await page.getByRole('button', { name: 'Speichern' }).click()

      // Should still be in dialog (save failed due to validation)
      await expect(page.getByRole('dialog')).toBeVisible()

      // Fix the invalid value
      await page.getByLabel('Fahrer-Kompensation (%)').fill('100')

      // Save should now work
      await page.getByRole('button', { name: 'Speichern' }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test('should persist team preferences settings after page reload', async ({ page }) => {
      // Navigate to team page and open the preferences tab (not the settings dialog)
      await page.goto('/team')
      await page.waitForURL('/team')

      // Wait for the page to load and look for tabs
      await page.waitForSelector('[role="tab"]')

      // Look for the preferences tab - handle both English and German
      const preferencesTab = page.getByRole('tab', { name: /Preferences|Konfiguration/ })

      // Debug: log what tabs are available
      const allTabs = await page.locator('[role="tab"]').allTextContents()
      console.log('Available tabs:', allTabs)

      await preferencesTab.click()

      // Make several changes to different settings sections

      // 1. Change tracking configuration
      await page
        .getByRole('checkbox', { name: /Include location in export|Standort in Export einschließen/ })
        .uncheck()
      await page
        .getByRole('checkbox', { name: /Include pause duration in export|Pausendauer in Export einschließen/ })
        .check()

      // Save tracking configuration
      const trackingCard = page.locator('div:has-text("Tracking Configuration"):has-text("Tracking Options")').first()
      await trackingCard.getByRole('button', { name: 'Save|Speichern' }).click()

      // Wait for save to complete
      await expect(page.getByText('Settings saved|Einstellungen gespeichert')).toBeVisible()

      // 2. Change compensation settings (if driving time is enabled)
      const compensationCard = page.locator('div:has-text("Compensation Defaults|Vergütungsstandards")').first()
      if (await compensationCard.isVisible()) {
        await page
          .getByRole('checkbox', { name: /Enable compensation split|Kompensations-Split aktivieren/ })
          .uncheck()

        await page.getByLabel('Default driver compensation|Standard Fahrer-Kompensation').fill('95')
        await page.getByLabel('Default passenger compensation|Standard Beifahrer-Kompensation').fill('85')

        // Save compensation settings
        await compensationCard.getByRole('button', { name: 'Save|Speichern' }).click()
        await expect(page.getByText('Settings saved|Einstellungen gespeichert')).toBeVisible()
      }

      // 3. Change company details
      const companyCard = page.locator('div:has-text("Team Company Details|Team-Firmendetails")').first()
      await companyCard.getByLabel('Company name|Firmenname').fill('Test Company Updated')
      await companyCard.getByLabel('Company email|Firmen-E-Mail').fill('updated@testcompany.com')

      // Save company settings
      await companyCard.getByRole('button', { name: 'Save|Speichern' }).click()
      await expect(page.getByText('Settings saved|Einstellungen gespeichert')).toBeVisible()

      // Now reload the page to test persistence
      await page.reload()
      await page.waitForURL('/team')

      // Navigate back to the preferences tab
      await preferencesTab.click()

      // Verify all the changes we made are still there

      // 1. Verify tracking configuration persisted
      await expect(
        page.getByRole('checkbox', { name: /Include location in export|Standort in Export einschließen/ })
      ).not.toBeChecked()
      await expect(
        page.getByRole('checkbox', { name: /Include pause duration in export|Pausendauer in Export einschließen/ })
      ).toBeChecked()

      // 2. Verify compensation settings persisted (if visible)
      if (await compensationCard.isVisible()) {
        await expect(
          page.getByRole('checkbox', { name: /Enable compensation split|Kompensations-Split aktivieren/ })
        ).not.toBeChecked()

        // Check input values using getByRole instead of getByDisplayValue
        const driverInput = page.getByRole('spinbutton', { name: /Default driver compensation|Standard Fahrer-Kompensation/ })
        const passengerInput = page.getByRole('spinbutton', { name: /Default passenger compensation|Standard Beifahrer-Kompensation/ })
        await expect(driverInput).toHaveValue('95')
        await expect(passengerInput).toHaveValue('85')
      }

      // 3. Verify company details persisted
      const companyNameInput = page.getByRole('textbox', { name: /Company name|Firmenname/ })
      const companyEmailInput = page.getByRole('textbox', { name: /Company email|Firmen-E-Mail/ })
      await expect(companyNameInput).toHaveValue('Test Company Updated')
      await expect(companyEmailInput).toHaveValue('updated@testcompany.com')
    })
  })
})
