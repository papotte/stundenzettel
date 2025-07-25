import React from 'react'

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useToast } from '@/hooks/use-toast'
import type { Team } from '@/lib/types'
// Import mocked services
import { updateTeam } from '@/services/team-service'

import { TeamSettingsDialog } from '../team-settings-dialog'

// Mock the team service
jest.mock('@/services/team-service', () => ({
  updateTeam: jest.fn(),
}))

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}))

const mockToast = {
  toast: jest.fn(),
}

const mockUpdateTeam = jest.fn()

const mockTeam: Team = {
  id: 'team-1',
  name: 'Test Team',
  description: 'A test team description',
  ownerId: 'user-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const defaultProps = {
  team: mockTeam,
  currentUserRole: 'owner' as const,
  onTeamUpdated: jest.fn(),
  children: <button>Settings</button>,
}

describe('TeamSettingsDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useToast as jest.Mock).mockReturnValue(mockToast)
    ;(updateTeam as jest.Mock).mockImplementation(mockUpdateTeam)
  })

  describe('Dialog Trigger', () => {
    it('renders children as trigger', () => {
      render(<TeamSettingsDialog {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: /settings/i }),
      ).toBeInTheDocument()
    })

    it('opens dialog when trigger is clicked', async () => {
      const user = userEvent.setup()
      render(<TeamSettingsDialog {...defaultProps} />)

      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('teams.settings')).toBeInTheDocument()
    })
  })

  describe('Dialog Content', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<TeamSettingsDialog {...defaultProps} />)

      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)
    })

    it('displays dialog title and description', () => {
      expect(screen.getByText('teams.settings')).toBeInTheDocument()
      expect(screen.getByText('teams.settingsDescription')).toBeInTheDocument()
    })

    it('renders team name input field', () => {
      expect(screen.getByLabelText('teams.teamName')).toBeInTheDocument()
    })

    it('renders team description textarea', () => {
      expect(screen.getByLabelText('teams.description')).toBeInTheDocument()
    })

    it('renders cancel and save buttons', () => {
      expect(
        screen.getByRole('button', { name: 'teams.cancel' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'teams.saveChanges' }),
      ).toBeInTheDocument()
    })

    it('pre-fills form with current team data', () => {
      expect(screen.getByLabelText('teams.teamName')).toHaveValue('Test Team')
      expect(screen.getByLabelText('teams.description')).toHaveValue(
        'A test team description',
      )
    })
  })

  describe('Form Submission', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<TeamSettingsDialog {...defaultProps} />)

      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)
    })

    it('allows submission with valid data', async () => {
      const user = userEvent.setup()
      mockUpdateTeam.mockResolvedValue(undefined)

      const nameInput = screen.getByLabelText('teams.teamName')
      const descriptionInput = screen.getByLabelText('teams.description')

      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Team Name')
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Updated team description')

      const saveButton = screen.getByRole('button', {
        name: 'teams.saveChanges',
      })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockUpdateTeam).toHaveBeenCalledWith('team-1', {
          name: 'Updated Team Name',
          description: 'Updated team description',
        })
      })
    })

    it('allows submission with only team name', async () => {
      const user = userEvent.setup()
      mockUpdateTeam.mockResolvedValue(undefined)

      const nameInput = screen.getByLabelText('teams.teamName')
      const descriptionInput = screen.getByLabelText('teams.description')

      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Team Name')
      await user.clear(descriptionInput)

      const saveButton = screen.getByRole('button', {
        name: 'teams.saveChanges',
      })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockUpdateTeam).toHaveBeenCalledWith('team-1', {
          name: 'Updated Team Name',
          description: undefined,
        })
      })
    })
  })

  describe('Team Update Flow', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<TeamSettingsDialog {...defaultProps} />)

      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)
    })

    it('successfully updates team and calls callback', async () => {
      const user = userEvent.setup()
      mockUpdateTeam.mockResolvedValue(undefined)

      const nameInput = screen.getByLabelText('teams.teamName')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Team Name')

      const saveButton = screen.getByRole('button', {
        name: 'teams.saveChanges',
      })
      await user.click(saveButton)

      await waitFor(() => {
        expect(defaultProps.onTeamUpdated).toHaveBeenCalledWith(
          expect.objectContaining({
            ...mockTeam,
            name: 'Updated Team Name',
            updatedAt: expect.any(Date),
          }),
        )
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'teams.teamUpdated',
          description: 'teams.teamUpdatedDescription',
        })
      })
    })

    it('closes dialog after successful update', async () => {
      const user = userEvent.setup()
      mockUpdateTeam.mockResolvedValue(undefined)

      const nameInput = screen.getByLabelText('teams.teamName')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Team Name')

      const saveButton = screen.getByRole('button', {
        name: 'teams.saveChanges',
      })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<TeamSettingsDialog {...defaultProps} />)

      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)
    })

    it('handles team update errors', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Failed to update team'
      mockUpdateTeam.mockRejectedValue(new Error(errorMessage))

      const nameInput = screen.getByLabelText('teams.teamName')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Team Name')

      const saveButton = screen.getByRole('button', {
        name: 'teams.saveChanges',
      })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'teams.error',
          description: errorMessage,
          variant: 'destructive',
        })
      })
    })

    it('handles unknown error types', async () => {
      const user = userEvent.setup()
      mockUpdateTeam.mockRejectedValue('Unknown error')

      const nameInput = screen.getByLabelText('teams.teamName')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Team Name')

      const saveButton = screen.getByRole('button', {
        name: 'teams.saveChanges',
      })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'teams.error',
          description: 'teams.failedToUpdateTeamSettings',
          variant: 'destructive',
        })
      })
    })
  })

  describe('Loading States', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<TeamSettingsDialog {...defaultProps} />)

      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)
    })

    it('shows loading state during team update', async () => {
      const user = userEvent.setup()
      let resolveUpdate: () => void
      const updatePromise = new Promise<void>((resolve) => {
        resolveUpdate = resolve
      })
      mockUpdateTeam.mockReturnValue(updatePromise)

      const nameInput = screen.getByLabelText('teams.teamName')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Team Name')

      const saveButton = screen.getByRole('button', {
        name: 'teams.saveChanges',
      })
      await user.click(saveButton)

      // Should show loading state
      expect(
        screen.getByRole('button', { name: 'teams.saving' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'teams.saving' }),
      ).toBeDisabled()

      // Resolve the promise
      resolveUpdate!()

      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: 'teams.saving' }),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Dialog Actions', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<TeamSettingsDialog {...defaultProps} />)

      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)
    })

    it('closes dialog when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const cancelButton = screen.getByRole('button', { name: 'teams.cancel' })

      await user.click(cancelButton)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('resets form when dialog is closed', async () => {
      const user = userEvent.setup()

      // Modify the form
      const nameInput = screen.getByLabelText('teams.teamName')
      const descriptionInput = screen.getByLabelText('teams.description')

      await user.clear(nameInput)
      await user.type(nameInput, 'Modified Name')
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Modified description')

      // Close dialog
      const cancelButton = screen.getByRole('button', { name: 'teams.cancel' })
      await user.click(cancelButton)

      // Reopen dialog
      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)

      // Form should be reset to original values
      expect(screen.getByLabelText('teams.teamName')).toHaveValue('Test Team')
      expect(screen.getByLabelText('teams.description')).toHaveValue(
        'A test team description',
      )
    })
  })

  describe('Form Reset', () => {
    it('resets form to original values when dialog is reopened', async () => {
      const user = userEvent.setup()
      render(<TeamSettingsDialog {...defaultProps} />)

      // Open dialog
      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)

      // Modify form
      const nameInput = screen.getByLabelText('teams.teamName')
      const descriptionInput = screen.getByLabelText('teams.description')

      await user.clear(nameInput)
      await user.type(nameInput, 'Modified Name')
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Modified description')

      // Close dialog
      const cancelButton = screen.getByRole('button', { name: 'teams.cancel' })
      await user.click(cancelButton)

      // Reopen dialog
      await user.click(settingsButton)

      // Form should be reset to original values
      expect(screen.getByLabelText('teams.teamName')).toHaveValue('Test Team')
      expect(screen.getByLabelText('teams.description')).toHaveValue(
        'A test team description',
      )
    })
  })

  describe('Team Data Display', () => {
    it('displays current team data correctly', async () => {
      const user = userEvent.setup()
      render(<TeamSettingsDialog {...defaultProps} />)

      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)

      expect(screen.getByLabelText('teams.teamName')).toHaveValue('Test Team')
      expect(screen.getByLabelText('teams.description')).toHaveValue(
        'A test team description',
      )
    })

    it('handles team without description', async () => {
      const teamWithoutDescription = { ...mockTeam, description: undefined }
      const user = userEvent.setup()
      render(
        <TeamSettingsDialog {...defaultProps} team={teamWithoutDescription} />,
      )

      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)

      expect(screen.getByLabelText('teams.teamName')).toHaveValue('Test Team')
      expect(screen.getByLabelText('teams.description')).toHaveValue('')
    })
  })
})
