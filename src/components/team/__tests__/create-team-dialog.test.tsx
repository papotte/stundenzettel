import React from 'react'

import { render, screen, waitFor } from '@jest-setup'
import userEvent from '@testing-library/user-event'

import { useToast } from '@/hooks/use-toast'
import type { Team } from '@/lib/types'
// Import mocked services
import { createTeam, getTeam } from '@/services/team-service'

import { CreateTeamDialog } from '../create-team-dialog'

// Mock the team service
jest.mock('@/services/team-service', () => ({
  createTeam: jest.fn(),
  getTeam: jest.fn(),
}))

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}))

const mockToast = {
  toast: jest.fn(),
}

const mockCreateTeam = jest.fn()
const mockGetTeam = jest.fn()

const mockTeam: Team = {
  id: 'team-1',
  name: 'Test Team',
  description: 'A test team description',
  ownerId: 'user-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const defaultProps = {
  userId: 'user-1',
  userEmail: 'test@example.com',
  onTeamCreated: jest.fn(),
}

describe('CreateTeamDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useToast as jest.Mock).mockReturnValue(mockToast)
    ;(createTeam as jest.Mock).mockImplementation(mockCreateTeam)
    ;(getTeam as jest.Mock).mockImplementation(mockGetTeam)
  })

  describe('Dialog Trigger', () => {
    it('renders create team button', () => {
      render(<CreateTeamDialog {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: /teams.createTeam/i }),
      ).toBeInTheDocument()
    })

    it('opens dialog when create team button is clicked', async () => {
      const user = userEvent.setup()
      render(<CreateTeamDialog {...defaultProps} />)

      const createButton = screen.getByRole('button', {
        name: /teams.createTeam/i,
      })
      await user.click(createButton)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      // Find the dialog title and description.
      expect(
        screen.getByRole('heading', { name: 'teams.createTeam' }),
      ).toBeInTheDocument()
      expect(screen.getByText('teams.subtitle')).toBeInTheDocument()
    })
  })

  describe('Dialog Content', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<CreateTeamDialog {...defaultProps} />)

      const createButton = screen.getByRole('button', {
        name: /teams.createTeam/i,
      })
      await user.click(createButton)
    })

    it('displays dialog title and description', () => {
      expect(
        screen.getByRole('heading', { name: 'teams.createTeam' }),
      ).toBeInTheDocument()
      expect(screen.getByText('teams.subtitle')).toBeInTheDocument()
    })

    it('renders team name input field', () => {
      expect(screen.getByLabelText('teams.teamName')).toBeInTheDocument()
    })

    it('renders team description textarea', () => {
      expect(screen.getByLabelText('teams.description')).toBeInTheDocument()
    })

    it('renders cancel and create buttons', () => {
      expect(
        screen.getByRole('button', { name: /common.cancel/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /teams.createTeam/i }),
      ).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<CreateTeamDialog {...defaultProps} />)

      const createButton = screen.getByRole('button', {
        name: /teams.createTeam/i,
      })
      await user.click(createButton)
    })

    it('shows error when submitting empty form', async () => {
      const user = userEvent.setup()
      const createButton = screen.getByRole('button', {
        name: /teams.createTeam/i,
      })

      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('teams.teamNameRequired')).toBeInTheDocument()
      })
    })

    it('allows submission with only team name', async () => {
      const user = userEvent.setup()
      mockCreateTeam.mockResolvedValue('team-1')
      mockGetTeam.mockResolvedValue(mockTeam)

      const nameInput = screen.getByLabelText('teams.teamName')
      await user.type(nameInput, 'Test Team')

      const createButton = screen.getByRole('button', {
        name: /teams.createTeam/i,
      })
      await user.click(createButton)

      await waitFor(() => {
        expect(mockCreateTeam).toHaveBeenCalledWith(
          'Test Team',
          '',
          'user-1',
          'test@example.com',
        )
      })
    })

    it('allows submission with team name and description', async () => {
      const user = userEvent.setup()
      mockCreateTeam.mockResolvedValue('team-1')
      mockGetTeam.mockResolvedValue(mockTeam)

      const nameInput = screen.getByLabelText('teams.teamName')
      const descriptionInput = screen.getByLabelText('teams.description')

      await user.type(nameInput, 'Test Team')
      await user.type(descriptionInput, 'A test team description')

      const createButton = screen.getByRole('button', {
        name: /teams.createTeam/i,
      })
      await user.click(createButton)

      await waitFor(() => {
        expect(mockCreateTeam).toHaveBeenCalledWith(
          'Test Team',
          'A test team description',
          'user-1',
          'test@example.com',
        )
      })
    })
  })

  describe('Team Creation Flow', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<CreateTeamDialog {...defaultProps} />)

      const createButton = screen.getByRole('button', {
        name: /teams.createTeam/i,
      })
      await user.click(createButton)
    })

    it('successfully creates team and calls callback', async () => {
      const user = userEvent.setup()
      mockCreateTeam.mockResolvedValue('team-1')
      mockGetTeam.mockResolvedValue(mockTeam)

      const nameInput = screen.getByLabelText('teams.teamName')
      await user.type(nameInput, 'Test Team')

      const createButton = screen.getByRole('button', {
        name: /teams.createTeam/i,
      })
      await user.click(createButton)

      await waitFor(() => {
        expect(defaultProps.onTeamCreated).toHaveBeenCalledWith(mockTeam)
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'teams.teamCreated',
          description: 'teams.teamCreatedDescription',
        })
      })
    })

    it('closes dialog after successful team creation', async () => {
      const user = userEvent.setup()
      mockCreateTeam.mockResolvedValue('team-1')
      mockGetTeam.mockResolvedValue(mockTeam)

      const nameInput = screen.getByLabelText('teams.teamName')
      await user.type(nameInput, 'Test Team')

      const createButton = screen.getByRole('button', {
        name: /teams.createTeam/i,
      })
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('resets form after successful team creation', async () => {
      const user = userEvent.setup()
      mockCreateTeam.mockResolvedValue('team-1')
      mockGetTeam.mockResolvedValue(mockTeam)

      const nameInput = screen.getByLabelText('teams.teamName')
      const descriptionInput = screen.getByLabelText('teams.description')

      await user.type(nameInput, 'Test Team')
      await user.type(descriptionInput, 'A test description')

      const createButton = screen.getByRole('button', {
        name: /teams.createTeam/i,
      })
      await user.click(createButton)

      // Reopen dialog to check if form is reset
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      const createButtonAgain = screen.getByRole('button', {
        name: /teams.createTeam/i,
      })
      await user.click(createButtonAgain)

      expect(screen.getByLabelText('teams.teamName')).toHaveValue('')
      expect(screen.getByLabelText('teams.description')).toHaveValue('')
    })
  })

  describe('Error Handling', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<CreateTeamDialog {...defaultProps} />)

      const createButton = screen.getByRole('button', {
        name: /teams.createTeam/i,
      })
      await user.click(createButton)
    })

    it('handles team creation error', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Failed to create team'
      mockCreateTeam.mockRejectedValue(new Error(errorMessage))

      const nameInput = screen.getByLabelText('teams.teamName')
      await user.type(nameInput, 'Test Team')

      const createButton = screen.getByRole('button', {
        name: /teams.createTeam/i,
      })
      await user.click(createButton)

      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'common.error',
          description: errorMessage,
          variant: 'destructive',
        })
      })
    })

    it('handles team retrieval error', async () => {
      const user = userEvent.setup()
      mockCreateTeam.mockResolvedValue('team-1')
      mockGetTeam.mockRejectedValue(new Error('Failed to get team'))

      const nameInput = screen.getByLabelText('teams.teamName')
      await user.type(nameInput, 'Test Team')

      const createButton = screen.getByRole('button', {
        name: /teams.createTeam/i,
      })
      await user.click(createButton)

      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'common.error',
          description: 'Failed to get team',
          variant: 'destructive',
        })
      })
    })

    it('handles unknown error types', async () => {
      const user = userEvent.setup()
      mockCreateTeam.mockRejectedValue('Unknown error')

      const nameInput = screen.getByLabelText('teams.teamName')
      await user.type(nameInput, 'Test Team')

      const createButton = screen.getByRole('button', {
        name: /teams.createTeam/i,
      })
      await user.click(createButton)

      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'common.error',
          description: 'teams.failedToCreateTeam',
          variant: 'destructive',
        })
      })
    })
  })

  describe('Loading States', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<CreateTeamDialog {...defaultProps} />)

      const createButton = screen.getByRole('button', {
        name: /teams.createTeam/i,
      })
      await user.click(createButton)
    })

    it('shows loading state during team creation', async () => {
      const user = userEvent.setup()
      let resolveCreateTeam: (value: string) => void
      const createTeamPromise = new Promise<string>((resolve) => {
        resolveCreateTeam = resolve
      })
      mockCreateTeam.mockReturnValue(createTeamPromise)
      mockGetTeam.mockResolvedValue(mockTeam)

      const nameInput = screen.getByLabelText('teams.teamName')
      await user.type(nameInput, 'Test Team')

      const createButton = screen.getByRole('button', {
        name: /teams.createTeam/i,
      })
      await user.click(createButton)

      // Should show loading state
      expect(
        screen.getByRole('button', { name: /common.creating/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /common.creating/i }),
      ).toBeDisabled()

      // Resolve the promise
      resolveCreateTeam!('team-1')

      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: /common.creating/i }),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Dialog Actions', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<CreateTeamDialog {...defaultProps} />)

      const createButton = screen.getByRole('button', {
        name: /teams.createTeam/i,
      })
      await user.click(createButton)
    })

    it('closes dialog when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const cancelButton = screen.getByRole('button', {
        name: /common.cancel/i,
      })

      await user.click(cancelButton)

      expect(screen.queryByTestId('create-team-dialog')).not.toBeInTheDocument()
    })
  })
})
