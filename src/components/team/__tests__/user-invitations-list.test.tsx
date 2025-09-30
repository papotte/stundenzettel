import React from 'react'

import { render, screen, waitFor } from '@jest-setup'
import userEvent from '@testing-library/user-event'

import { useToast } from '@/hooks/use-toast'
import type { TeamInvitation } from '@/lib/types'
// Import mocked services
import {
  acceptTeamInvitation,
  declineTeamInvitation,
} from '@/services/team-service'

import { UserInvitationsList } from '../user-invitations-list'

// Mock the team service
jest.mock('@/services/team-service', () => ({
  acceptTeamInvitation: jest.fn(),
  declineTeamInvitation: jest.fn(),
}))

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}))

// Mock the user invitations hook
jest.mock('@/hooks/use-user-invitations', () => ({
  useUserInvitations: () => ({
    refreshInvitations: jest.fn(),
  }),
}))

const mockToast = {
  toast: jest.fn(),
}

const mockAcceptTeamInvitation = jest.fn()
const mockDeclineTeamInvitation = jest.fn()

// Use dates that are definitely in the future relative to the mocked current date
const mockInvitations: TeamInvitation[] = [
  {
    id: 'invitation-1',
    teamId: 'team-1',
    email: 'user@example.com',
    role: 'member',
    invitedBy: 'owner@example.com',
    invitedAt: new Date('2024-01-01'),
    expiresAt: new Date('2025-12-31'), // Far in the future
    status: 'pending',
  },
  {
    id: 'invitation-2',
    teamId: 'team-2',
    email: 'user@example.com',
    role: 'admin',
    invitedBy: 'admin@example.com',
    invitedAt: new Date('2024-01-02'),
    expiresAt: new Date('2025-12-30'), // Far in the future
    status: 'pending',
  },
]

const defaultProps = {
  invitations: mockInvitations,
  onInvitationsChange: jest.fn(),
  onInvitationAccepted: jest.fn(),
  currentUserEmail: 'user@example.com',
  currentUserId: 'user-1',
}

describe('UserInvitationsList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useToast as jest.Mock).mockReturnValue(mockToast)
    ;(acceptTeamInvitation as jest.Mock).mockImplementation(
      mockAcceptTeamInvitation,
    )
    ;(declineTeamInvitation as jest.Mock).mockImplementation(
      mockDeclineTeamInvitation,
    )
  })

  describe('Rendering', () => {
    it('renders user invitations list', () => {
      render(<UserInvitationsList {...defaultProps} />)

      // Component renders translation keys, not actual text
      expect(screen.getByText('teams.team')).toBeInTheDocument()
      expect(screen.getByText('teams.role')).toBeInTheDocument()
      expect(screen.getByText('teams.status')).toBeInTheDocument()
      expect(screen.getByText('teams.expires')).toBeInTheDocument()
      expect(screen.getByText('teams.actions')).toBeInTheDocument()
    })

    it('displays invitation data in table', () => {
      render(<UserInvitationsList {...defaultProps} />)

      expect(screen.getAllByText('teams.teamInvitation')).toHaveLength(2)
      expect(screen.getByText('teams.roles.member')).toBeInTheDocument()
      expect(screen.getByText('teams.roles.admin')).toBeInTheDocument()
      expect(screen.getAllByText('teams.pending')).toHaveLength(2)
    })

    it('shows accept and decline buttons for pending invitations', () => {
      render(<UserInvitationsList {...defaultProps} />)

      expect(screen.getAllByText('teams.accept')).toHaveLength(2)
      expect(screen.getAllByText('teams.decline')).toHaveLength(2)
    })
  })

  describe('Empty State', () => {
    it('displays empty state when no invitations', () => {
      render(<UserInvitationsList {...defaultProps} invitations={[]} />)

      expect(screen.getByText('teams.noPendingInvitations')).toBeInTheDocument()
    })
  })

  describe('Invitation Actions', () => {
    it('handles accept invitation', async () => {
      const user = userEvent.setup()
      mockAcceptTeamInvitation.mockResolvedValue(undefined)

      render(<UserInvitationsList {...defaultProps} />)

      const acceptButtons = screen.getAllByText('teams.accept')
      await user.click(acceptButtons[0])

      await waitFor(() => {
        expect(mockAcceptTeamInvitation).toHaveBeenCalledWith(
          'invitation-1',
          'user-1',
          'user@example.com',
        )
        expect(defaultProps.onInvitationsChange).toHaveBeenCalledWith([
          mockInvitations[1],
        ])
        expect(defaultProps.onInvitationAccepted).toHaveBeenCalled()
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'teams.invitationAccepted',
          description: 'teams.invitationAcceptedDescription',
        })
      })
    })

    it('handles decline invitation', async () => {
      const user = userEvent.setup()
      mockDeclineTeamInvitation.mockResolvedValue(undefined)

      render(<UserInvitationsList {...defaultProps} />)

      const declineButtons = screen.getAllByText('teams.decline')
      await user.click(declineButtons[0])

      await waitFor(() => {
        expect(mockDeclineTeamInvitation).toHaveBeenCalledWith('invitation-1')
        expect(defaultProps.onInvitationsChange).toHaveBeenCalledWith([
          mockInvitations[1],
        ])
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'teams.invitationDeclined',
          description: 'teams.invitationDeclinedDescription',
        })
      })
    })

    it('handles accept invitation errors', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Failed to accept invitation'
      mockAcceptTeamInvitation.mockRejectedValue(new Error(errorMessage))

      render(<UserInvitationsList {...defaultProps} />)

      const acceptButtons = screen.getAllByText('teams.accept')
      await user.click(acceptButtons[0])

      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'common.error',
          description: errorMessage,
          variant: 'destructive',
        })
      })
    })

    it('handles decline invitation errors', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Failed to decline invitation'
      mockDeclineTeamInvitation.mockRejectedValue(new Error(errorMessage))

      render(<UserInvitationsList {...defaultProps} />)

      const declineButtons = screen.getAllByText('teams.decline')
      await user.click(declineButtons[0])

      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'common.error',
          description: errorMessage,
          variant: 'destructive',
        })
      })
    })

    it('handles unknown error types', async () => {
      const user = userEvent.setup()
      mockAcceptTeamInvitation.mockRejectedValue('Unknown error')

      render(<UserInvitationsList {...defaultProps} />)

      const acceptButtons = screen.getAllByText('teams.accept')
      await user.click(acceptButtons[0])

      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'common.error',
          description: 'teams.failedToAcceptInvitation',
          variant: 'destructive',
        })
      })
    })
  })

  describe('Loading States', () => {
    it('disables buttons during loading', async () => {
      const user = userEvent.setup()
      let resolveAccept: () => void
      const acceptPromise = new Promise<void>((resolve) => {
        resolveAccept = resolve
      })
      mockAcceptTeamInvitation.mockReturnValue(acceptPromise)

      render(<UserInvitationsList {...defaultProps} />)

      const acceptButtons = screen.getAllByText('teams.accept')
      await user.click(acceptButtons[0])

      // Buttons should be disabled during loading
      expect(acceptButtons[0]).toBeDisabled()
      expect(screen.getAllByText('teams.decline')[0]).toBeDisabled()

      resolveAccept!()

      await waitFor(() => {
        expect(acceptButtons[0]).not.toBeDisabled()
      })
    })
  })

  describe('Expired Invitations', () => {
    it('shows expired status for expired invitations', () => {
      const expiredInvitations: TeamInvitation[] = [
        {
          id: 'expired-1',
          teamId: 'team-1',
          email: 'user@example.com',
          role: 'member',
          invitedBy: 'owner@example.com',
          invitedAt: new Date('2023-01-01'),
          expiresAt: new Date('2020-01-01'), // Past date
          status: 'pending',
        },
      ]

      render(
        <UserInvitationsList
          {...defaultProps}
          invitations={expiredInvitations}
        />,
      )

      expect(screen.getAllByText('teams.expired')).toHaveLength(2)
    })

    it('hides action buttons for expired invitations', () => {
      const expiredInvitations: TeamInvitation[] = [
        {
          id: 'expired-1',
          teamId: 'team-1',
          email: 'user@example.com',
          role: 'member',
          invitedBy: 'owner@example.com',
          invitedAt: new Date('2023-01-01'),
          expiresAt: new Date('2020-01-01'), // Past date
          status: 'pending',
        },
      ]

      render(
        <UserInvitationsList
          {...defaultProps}
          invitations={expiredInvitations}
        />,
      )

      expect(screen.queryByText('teams.accept')).not.toBeInTheDocument()
      expect(screen.queryByText('teams.decline')).not.toBeInTheDocument()
      expect(screen.getAllByText('teams.expired')).toHaveLength(2)
    })
  })

  describe('Table Structure', () => {
    it('displays invitation data in correct columns', () => {
      render(<UserInvitationsList {...defaultProps} />)

      // Check that all table headers are present
      expect(screen.getByText('teams.team')).toBeInTheDocument()
      expect(screen.getByText('teams.role')).toBeInTheDocument()
      expect(screen.getByText('teams.status')).toBeInTheDocument()
      expect(screen.getByText('teams.expires')).toBeInTheDocument()
      expect(screen.getByText('teams.actions')).toBeInTheDocument()

      // Check that invitation data is displayed
      expect(screen.getAllByText('teams.teamInvitation')).toHaveLength(2)
    })
  })

  describe('Role Display', () => {
    it('displays member role correctly', () => {
      render(<UserInvitationsList {...defaultProps} />)

      expect(screen.getByText('teams.roles.member')).toBeInTheDocument()
    })

    it('displays admin role correctly', () => {
      render(<UserInvitationsList {...defaultProps} />)

      expect(screen.getByText('teams.roles.admin')).toBeInTheDocument()
    })
  })
})
