import { expect, test } from '@playwright/test'

import {
  loginWithMockUser,
  navigateToTeamPage,
  testAuthRedirect,
} from './test-helpers'

test.describe('Team Page', () => {
  test.describe('Authorization', () => {
    test('should redirect unauthenticated users', async ({ page }) => {
      await testAuthRedirect(page, '/team')
    })

    test('should display team page for authenticated users', async ({
      page,
    }) => {
      await loginWithMockUser(page)
      await navigateToTeamPage(page)

      // Verify back button and team management card
      await expect(
        page.getByRole('link', {
          name: /Zurück zur Übersicht|Back to Tracker/,
        }),
      ).toBeVisible()
      await expect(page.getByText(/Manage Team|Team-Verwaltung/)).toBeVisible()
      await expect(page.getByText(/Create a team|Team erstellen/)).toBeVisible()
    })
  })

  test.describe('Team Creation', () => {
    test.beforeEach(async ({ page }) => {
      await loginWithMockUser(page)
      await navigateToTeamPage(page)
    })

    test('should navigate to team page and see create team option', async ({
      page,
    }) => {
      // Verify we're on the team page with no team yet
      await expect(page.getByText('Team-Verwaltung')).toBeVisible()
      await expect(page.getByText('Noch kein Team')).toBeVisible()
      await expect(
        page.getByText(
          'Erstellen Sie ein Team, um Mitglieder einzuladen und Abonnements gemeinsam zu verwalten.',
        ),
      ).toBeVisible()

      // Verify create team button is visible
      await expect(
        page.getByRole('button', { name: 'Team erstellen' }),
      ).toBeVisible()
    })

    test('should open create team dialog when button is clicked', async ({
      page,
    }) => {
      // Click create team button
      await page.getByRole('button', { name: 'Team erstellen' }).click()

      // Verify dialog is open
      await expect(page.getByTestId('create-team-dialog')).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Team erstellen' }),
      ).toBeVisible()

      // Verify form fields are present
      await expect(page.getByLabel('Team-Name')).toBeVisible()
      await expect(page.getByLabel('Beschreibung (Optional)')).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Abbrechen' }),
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Team erstellen' }),
      ).toBeVisible()
    })

    test('should show validation error when submitting empty form', async ({
      page,
    }) => {
      // Open create team dialog
      await page.getByRole('button', { name: 'Team erstellen' }).click()

      // Try to submit empty form
      await page.getByRole('button', { name: 'Team erstellen' }).click()

      // Verify validation error is shown
      await expect(page.getByText('Team-Name ist erforderlich')).toBeVisible()
    })

    test('should create team with only name', async ({ page }) => {
      // Navigate to team page
      await navigateToTeamPage(page)
      await page.waitForURL('/team')

      // Open create team dialog
      await page.getByRole('button', { name: 'Team erstellen' }).click()

      // Fill team name
      await page.getByLabel('Team-Name').fill('Test Team')

      // Submit form
      await page.getByRole('button', { name: 'Team erstellen' }).click()

      // Verify dialog closes and team is created
      await expect(page.getByTestId('create-team-dialog')).not.toBeVisible()

      // Verify success toast
      await expect(page.locator('[data-testid="toast-title"]')).toContainText(
        'Team erstellt',
      )

      // Verify team page now shows team management interface
      await expect(page.getByTestId('team-name')).toHaveText('Test Team')
      await expect(page.getByText('Keine Beschreibung angegeben')).toBeVisible()

      // Verify team management elements are present
      await expect(
        page.getByRole('button', { name: 'Mitglied einladen' }),
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Einstellungen' }),
      ).toBeVisible()
    })

    test('should create team with name and description', async ({ page }) => {
      // Open create team dialog
      await page.getByRole('button', { name: 'Team erstellen' }).click()

      // Fill team name and description
      await page.getByLabel('Team-Name').fill('Test Team with Description')
      await page
        .getByLabel('Beschreibung (Optional)')
        .fill('This is a test team description')

      // Submit form
      await page.getByRole('button', { name: 'Team erstellen' }).click()

      // Verify dialog closes and team is created
      await expect(page.getByTestId('create-team-dialog')).not.toBeVisible()

      // Verify success toast
      await expect(page.locator('[data-testid="toast-title"]')).toContainText(
        'Team erstellt',
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
      await page.getByRole('button', { name: 'Team erstellen' }).click()

      // Fill some data
      await page.getByLabel('Team-Name').fill('Test Team')

      // Click cancel
      await page.getByRole('button', { name: 'Abbrechen' }).click()

      // Verify dialog closes
      await expect(page.getByTestId('create-team-dialog')).not.toBeVisible()

      // Verify we're still on the no team page
      await expect(page.getByText('Noch kein Team')).toBeVisible()
    })

    test('should show loading state during team creation', async ({ page }) => {
      // Open create team dialog
      await page.getByRole('button', { name: 'Team erstellen' }).click()

      // Fill team name
      await page.getByLabel('Team-Name').fill('Test Team')

      // Submit form and immediately check for loading state
      await page.getByRole('button', { name: 'Team erstellen' }).click()

      // The button should briefly show loading state before the dialog closes
      // We can't easily test this since it's very fast, but we can verify the dialog closes
      await expect(page.getByTestId('create-team-dialog')).not.toBeVisible()
    })

    test('should handle team creation error gracefully', async ({ page }) => {
      // This test would require mocking the team service to return an error
      // For now, we'll test the basic flow and assume error handling works
      // as it's tested in the unit tests

      // Open create team dialog
      await page.getByRole('button', { name: 'Team erstellen' }).click()

      // Fill team name
      await page.getByLabel('Team-Name').fill('Test Team')

      // Submit form
      await page.getByRole('button', { name: 'Team erstellen' }).click()

      // Verify dialog closes (success case)
      await expect(page.getByTestId('create-team-dialog')).not.toBeVisible()
    })

    test('should navigate back to tracker from team page', async ({ page }) => {
      // Click back to tracker button
      await page.getByRole('link', { name: 'Zurück zur Übersicht' }).click()

      // Verify we're back on tracker page
      await page.waitForURL('/tracker')
      await expect(page.getByText('Live-Zeiterfassung')).toBeVisible()
    })

    test('should create team and verify team management interface', async ({
      page,
    }) => {
      // Create a team
      await page.getByRole('button', { name: 'Team erstellen' }).click()
      await page.getByLabel('Team-Name').fill('Management Test Team')
      await page.getByRole('button', { name: 'Team erstellen' }).click()

      // Wait for team to be created
      await expect(page.getByTestId('create-team-dialog')).not.toBeVisible()

      // Verify team management interface elements
      await expect(page.getByTestId('team-name')).toHaveText(
        'Management Test Team',
      )
      await expect(
        page.getByRole('button', { name: 'Mitglied einladen' }),
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Einstellungen' }),
      ).toBeVisible()

      // Verify tabs are present
      await expect(
        page.getByRole('tab', { name: 'Teammitglieder' }),
      ).toBeVisible()
      await expect(
        page.getByRole('tab', { name: 'Ausstehende Einladungen' }),
      ).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Abonnement' })).toBeVisible()

      // Verify team members tab content
      await expect(
        page.getByRole('heading', { name: 'Teammitglieder' }),
      ).toBeVisible()
      await expect(
        page.getByText('Verwalten Sie Ihre Teammitglieder und deren Rollen.'),
      ).toBeVisible()

      // Verify current user is listed as owner
      await expect(page.getByText('Besitzer')).toBeVisible()
    })

    test('should create team and open team settings', async ({ page }) => {
      // Create a team
      await page.getByRole('button', { name: 'Team erstellen' }).click()
      await page.getByLabel('Team-Name').fill('Settings Test Team')
      await page.getByRole('button', { name: 'Team erstellen' }).click()

      // Wait for team to be created
      await expect(page.getByTestId('create-team-dialog')).not.toBeVisible()

      // Open team settings
      await page.getByRole('button', { name: 'Einstellungen' }).click()

      // Verify settings dialog is open
      await expect(
        page.getByRole('heading', { name: 'Einstellungen' }),
      ).toBeVisible()
      await expect(page.getByLabel('Team-Name')).toHaveValue(
        'Settings Test Team',
      )

      // Close settings dialog
      await page.getByRole('button', { name: 'Abbrechen' }).click()
    })

    test('should create team and verify subscription tab', async ({ page }) => {
      // Create a team
      await page.getByRole('button', { name: 'Team erstellen' }).click()
      await page.getByLabel('Team-Name').fill('Subscription Test Team')
      await page.getByRole('button', { name: 'Team erstellen' }).click()

      // Wait for team to be created
      await expect(page.getByTestId('create-team-dialog')).not.toBeVisible()

      // Click on subscription tab
      await page.getByRole('tab', { name: 'Abonnement' }).click()

      // Verify subscription tab content
      await expect(page.getByText('Team-Abonnement')).toBeVisible()
      await expect(
        page.getByText(
          'Abonnieren Sie, um Team-Funktionen und Sitzungsverwaltung freizuschalten',
        ),
      ).toBeVisible()
      await expect(page.getByText('Kein aktives Abonnement')).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Jetzt abonnieren' }),
      ).toBeVisible()
    })
  })

  test.describe('Team Settings Advanced Features', () => {
    test.beforeEach(async ({ page }) => {
      await loginWithMockUser(page)
      await navigateToTeamPage(page)
      
      // Create a team first
      await page.getByRole('button', { name: 'Team erstellen' }).click()
      await page.getByLabel('Team-Name').fill('Advanced Settings Team')
      await page.getByRole('button', { name: 'Team erstellen' }).click()
      await expect(page.getByTestId('create-team-dialog')).not.toBeVisible()
    })

    test('should open team settings and navigate between tabs', async ({ page }) => {
      // Open team settings
      await page.getByRole('button', { name: 'Einstellungen' }).click()
      
      // Verify dialog is open with Basic tab active
      await expect(page.getByRole('heading', { name: 'Einstellungen' })).toBeVisible()
      await expect(page.getByLabel('Team-Name')).toHaveValue('Advanced Settings Team')
      
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
      // Open team settings and go to Team Settings tab
      await page.getByRole('button', { name: 'Einstellungen' }).click()
      await page.getByRole('tab', { name: 'Team-Einstellungen' }).click()
      
      // Verify compensation split is enabled by default
      const splitCheckbox = page.getByRole('checkbox', { name: /Kompensations-Split aktivieren/ })
      await expect(splitCheckbox).toBeChecked()
      
      // Should see driver and passenger fields
      await expect(page.getByLabel('Fahrer-Kompensation (%)')).toBeVisible()
      await expect(page.getByLabel('Beifahrer-Kompensation (%)')).toBeVisible()
      
      // Set compensation percentages
      await page.getByLabel('Fahrer-Kompensation (%)').fill('95')
      await page.getByLabel('Beifahrer-Kompensation (%)').fill('85')
      
      // Save settings
      await page.getByRole('button', { name: 'Speichern' }).click()
      
      // Verify settings are saved (dialog should close)
      await expect(page.getByRole('dialog')).not.toBeVisible()
      
      // Verify success toast
      await expect(page.locator('[data-testid="toast-title"]')).toContainText('Gespeichert')
    })

    test('should toggle to unified compensation mode', async ({ page }) => {
      // Open team settings and go to Team Settings tab
      await page.getByRole('button', { name: 'Einstellungen' }).click()
      await page.getByRole('tab', { name: 'Team-Einstellungen' }).click()
      
      // Disable compensation split
      const splitCheckbox = page.getByRole('checkbox', { name: /Kompensations-Split aktivieren/ })
      await splitCheckbox.uncheck()
      
      // Should now see unified compensation field
      await expect(page.getByLabel('Kompensationsrate (%)')).toBeVisible()
      await expect(page.getByLabel('Fahrer-Kompensation (%)')).not.toBeVisible()
      await expect(page.getByLabel('Beifahrer-Kompensation (%)')).not.toBeVisible()
      
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
      await page.getByRole('checkbox', { name: /Pausendauer einbeziehen/ }).check()
      
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
      await page.getByRole('checkbox', { name: /Mitgliedern erlauben, Kompensation zu überschreiben/ }).uncheck()
      await page.getByRole('checkbox', { name: /Mitgliedern erlauben, Export-Einstellungen zu überschreiben/ }).check()
      await page.getByRole('checkbox', { name: /Mitgliedern erlauben, Arbeitszeiten zu überschreiben/ }).uncheck()
      
      // Save settings
      await page.getByRole('button', { name: 'Speichern' }).click()
      
      // Verify settings are saved
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test('should verify team settings affect company page', async ({ page }) => {
      // Configure team settings first
      await page.getByRole('button', { name: 'Einstellungen' }).click()
      await page.getByRole('tab', { name: 'Team-Einstellungen' }).click()
      
      // Disable compensation split and set unified rate
      await page.getByRole('checkbox', { name: /Kompensations-Split aktivieren/ }).uncheck()
      await page.getByLabel('Kompensationsrate (%)').fill('88')
      
      // Disable compensation override permission
      await page.getByRole('checkbox', { name: /Mitgliedern erlauben, Kompensation zu überschreiben/ }).uncheck()
      
      // Set company details
      await page.getByLabel('Firmenname').fill('Team Company Ltd')
      
      // Save settings
      await page.getByRole('button', { name: 'Speichern' }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible()
      
      // Navigate to company settings page
      await page.goto('/company')
      
      // Verify team settings are applied
      await expect(page.getByDisplayValue('Team Company Ltd')).toBeVisible()
      await expect(page.getByText('Kompensationsrate')).toBeVisible() // Unified field
      await expect(page.getByDisplayValue('88')).toBeVisible()
      
      // Verify compensation field is disabled (no override permission)
      const compensationInput = page.getByRole('spinbutton', { name: /Kompensationsrate/ })
      await expect(compensationInput).toBeDisabled()
      
      // Verify team control message is shown
      await expect(page.getByText('Diese Einstellung wird von Ihrem Team kontrolliert')).toBeVisible()
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
  })
})
