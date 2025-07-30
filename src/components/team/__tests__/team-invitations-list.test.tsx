import React from 'react'

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useToast } from '@/hooks/use-toast'
import type { TeamInvitation } from '@/lib/types'
// Import mocked services
import {
  createTeamInvitation,
  declineTeamInvitation,
} from '@/services/team-service'

import { TeamInvitationsList } from '../team-invitations-list'

// Mock the team service
jest.mock('@/services/team-service', () => ({
  createTeamInvitation: jest.fn(),
  declineTeamInvitation: jest.fn(),
}))

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}))

const mockToast = {
  toast: jest.fn(),
}

const mockCreateTeamInvitation = jest.fn()
const mockDeclineTeamInvitation = jest.fn()

const mockInvitations: TeamInvitation[] = [
  {
    id: 'invitation-1',
    teamId: 'team-1',
    email: 'invite1@example.com',
    role: 'member',
    invitedBy: 'user-1',
    invitedAt: new Date('2024-01-01'),
    expiresAt: new Date('2024-01-08'),
    status: 'pending',
  },
  {
    id: 'invitation-2',
    teamId: 'team-1',
    email: 'invite2@example.com',
    role: 'admin',
    invitedBy: 'user-1',
    invitedAt: new Date('2024-01-02'),
    expiresAt: new Date('2024-01-09'),
    status: 'pending',
  },
]

const defaultProps = {
  invitations: mockInvitations,
  onInvitationsChange: jest.fn(),
}

describe('TeamInvitationsList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useToast as jest.Mock).mockReturnValue(mockToast)
    ;(createTeamInvitation as jest.Mock).mockImplementation(
      mockCreateTeamInvitation,
    )
    ;(declineTeamInvitation as jest.Mock).mockImplementation(
      mockDeclineTeamInvitation,
    )
  })

  describe('Rendering', () => {
    it('renders invitation list with correct data', () => {
      render(<TeamInvitationsList {...defaultProps} />)

      expect(screen.getByText('invite1@example.com')).toBeInTheDocument()
      expect(screen.getByText('invite2@example.com')).toBeInTheDocument()
      expect(screen.getByText('teams.roles.member')).toBeInTheDocument()
      expect(screen.getByText('teams.roles.admin')).toBeInTheDocument()
    })

    it('displays correct table headers', () => {
      render(<TeamInvitationsList {...defaultProps} />)

      expect(screen.getByText('teams.emailAddress')).toBeInTheDocument()
      expect(screen.getByText('teams.role')).toBeInTheDocument()
      expect(screen.getByText('teams.status')).toBeInTheDocument()
      expect(screen.getByText('teams.expires')).toBeInTheDocument()
    })

    it('shows expired status for expired invitations', () => {
      const expiredInvitations: TeamInvitation[] = [
        {
          id: 'invitation-1',
          teamId: 'team-1',
          email: 'expired@example.com',
          role: 'member',
          invitedBy: 'user-1',
          invitedAt: new Date('2023-12-01'),
          expiresAt: new Date('2023-12-31'), // Expired (past date)
          status: 'pending',
        },
      ]

      render(
        <TeamInvitationsList
          {...defaultProps}
          invitations={expiredInvitations}
        />,
      )

      expect(screen.getByText('teams.expired')).toBeInTheDocument()
    })

    it('shows pending status for active invitations', () => {
      const activeInvitations: TeamInvitation[] = [
        {
          id: 'invitation-1',
          teamId: 'team-1',
          email: 'active@example.com',
          role: 'member',
          invitedBy: 'user-1',
          invitedAt: new Date('2024-01-01'),
          expiresAt: new Date('2025-12-31'), // Future date
          status: 'pending',
        },
      ]

      render(
        <TeamInvitationsList
          {...defaultProps}
          invitations={activeInvitations}
        />,
      )

      expect(screen.getByText('teams.pending')).toBeInTheDocument()
    })
  })

  describe('Actions', () => {
    it('calls onInvitationsChange when invitation is cancelled', async () => {
      const user = userEvent.setup()
      mockDeclineTeamInvitation.mockResolvedValue(undefined)

      render(<TeamInvitationsList {...defaultProps} />)

      // Open dropdown for first invitation
      const dropdownButtons = screen.getAllByRole('button')
      const firstDropdownButton = dropdownButtons.find(
        (button) => button.getAttribute('aria-haspopup') === 'menu',
      )
      expect(firstDropdownButton).toBeInTheDocument()
      await user.click(firstDropdownButton!)

      // Click cancel invitation
      const cancelButton = screen.getByText('teams.cancelInvitation')
      await user.click(cancelButton)

      await waitFor(() => {
        expect(mockDeclineTeamInvitation).toHaveBeenCalledWith('invitation-1')
        expect(defaultProps.onInvitationsChange).toHaveBeenCalledWith([
          mockInvitations[1],
        ])
      })
    })

    it('calls onInvitationsChange when invitation is resent', async () => {
      const user = userEvent.setup()
      mockDeclineTeamInvitation.mockResolvedValue(undefined)
      mockCreateTeamInvitation.mockResolvedValue('new-invitation-id')

      render(<TeamInvitationsList {...defaultProps} />)

      // Open dropdown for first invitation
      const dropdownButtons = screen.getAllByRole('button')
      const firstDropdownButton = dropdownButtons.find(
        (button) => button.getAttribute('aria-haspopup') === 'menu',
      )
      expect(firstDropdownButton).toBeInTheDocument()
      await user.click(firstDropdownButton!)

      // Click resend invitation
      const resendButton = screen.getByText('teams.resendInvitation')
      await user.click(resendButton)

      await waitFor(() => {
        expect(mockDeclineTeamInvitation).toHaveBeenCalledWith('invitation-1')
        expect(mockCreateTeamInvitation).toHaveBeenCalledWith(
          'team-1',
          'invite1@example.com',
          'member',
          'user-1',
        )
        expect(defaultProps.onInvitationsChange).toHaveBeenCalled()
      })
    })

    it('shows loading state during actions', async () => {
      const user = userEvent.setup()
      let resolveDecline: () => void
      const declinePromise = new Promise<void>((resolve) => {
        resolveDecline = resolve
      })
      mockDeclineTeamInvitation.mockReturnValue(declinePromise)

      render(<TeamInvitationsList {...defaultProps} />)

      // Open dropdown for first invitation
      const dropdownButtons = screen.getAllByRole('button')
      const firstDropdownButton = dropdownButtons.find(
        (button) => button.getAttribute('aria-haspopup') === 'menu',
      )
      expect(firstDropdownButton).toBeInTheDocument()
      await user.click(firstDropdownButton!)

      // Click cancel invitation
      const cancelButton = screen.getByText('teams.cancelInvitation')
      await user.click(cancelButton)

      // Should show loading state
      expect(firstDropdownButton).toBeDisabled()

      // Resolve the promise
      resolveDecline!()

      await waitFor(() => {
        expect(firstDropdownButton).not.toBeDisabled()
      })
    })
  })

  describe('Error Handling', () => {
    it('shows error toast when cancellation fails', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Failed to cancel invitation'
      mockDeclineTeamInvitation.mockRejectedValue(new Error(errorMessage))

      render(<TeamInvitationsList {...defaultProps} />)

      // Open dropdown for first invitation
      const dropdownButtons = screen.getAllByRole('button')
      const firstDropdownButton = dropdownButtons.find(
        (button) => button.getAttribute('aria-haspopup') === 'menu',
      )
      expect(firstDropdownButton).toBeInTheDocument()
      await user.click(firstDropdownButton!)

      // Click cancel invitation
      const cancelButton = screen.getByText('teams.cancelInvitation')
      await user.click(cancelButton)

      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'common.error',
          description: errorMessage,
          variant: 'destructive',
        })
      })
    })

    it('shows error toast when resend fails', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Failed to resend invitation'
      mockDeclineTeamInvitation.mockResolvedValue(undefined)
      mockCreateTeamInvitation.mockRejectedValue(new Error(errorMessage))

      render(<TeamInvitationsList {...defaultProps} />)

      // Open dropdown for first invitation
      const dropdownButtons = screen.getAllByRole('button')
      const firstDropdownButton = dropdownButtons.find(
        (button) => button.getAttribute('aria-haspopup') === 'menu',
      )
      expect(firstDropdownButton).toBeInTheDocument()
      await user.click(firstDropdownButton!)

      // Click resend invitation
      const resendButton = screen.getByText('teams.resendInvitation')
      await user.click(resendButton)

      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'common.error',
          description: errorMessage,
          variant: 'destructive',
        })
      })
    })
  })

  describe('Role Display', () => {
    it('displays member role correctly', () => {
      render(<TeamInvitationsList {...defaultProps} />)

      expect(screen.getByText('teams.roles.member')).toBeInTheDocument()
    })

    it('displays admin role correctly', () => {
      render(<TeamInvitationsList {...defaultProps} />)

      expect(screen.getByText('teams.roles.admin')).toBeInTheDocument()
    })

    it('handles different role types', () => {
      const differentRoles: TeamInvitation[] = [
        {
          id: 'invitation-1',
          teamId: 'team-1',
          email: 'member@example.com',
          role: 'member',
          invitedBy: 'user-1',
          invitedAt: new Date('2024-01-01'),
          expiresAt: new Date('2024-01-08'),
          status: 'pending',
        },
        {
          id: 'invitation-2',
          teamId: 'team-1',
          email: 'admin@example.com',
          role: 'admin',
          invitedBy: 'user-1',
          invitedAt: new Date('2024-01-02'),
          expiresAt: new Date('2024-01-09'),
          status: 'pending',
        },
      ]

      render(
        <TeamInvitationsList {...defaultProps} invitations={differentRoles} />,
      )

      expect(screen.getByText('teams.roles.member')).toBeInTheDocument()
      expect(screen.getByText('teams.roles.admin')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows appropriate message when no invitations', () => {
      render(<TeamInvitationsList {...defaultProps} invitations={[]} />)

      expect(screen.getByText('teams.noPendingInvitations')).toBeInTheDocument()
    })

    it('does not show table when no invitations', () => {
      render(<TeamInvitationsList {...defaultProps} invitations={[]} />)

      // Should not show table headers when no invitations
      expect(screen.queryByText('teams.emailAddress')).not.toBeInTheDocument()
      expect(screen.queryByText('teams.role')).not.toBeInTheDocument()
      expect(screen.queryByText('teams.status')).not.toBeInTheDocument()
      expect(screen.queryByText('teams.expires')).not.toBeInTheDocument()
    })
  })

  describe('Table Structure', () => {
    it('displays correct table headers', () => {
      render(<TeamInvitationsList {...defaultProps} />)

      expect(screen.getByText('teams.emailAddress')).toBeInTheDocument()
      expect(screen.getByText('teams.role')).toBeInTheDocument()
      expect(screen.getByText('teams.status')).toBeInTheDocument()
      expect(screen.getByText('teams.expires')).toBeInTheDocument()
    })

    it('displays invitation data in correct columns', () => {
      render(<TeamInvitationsList {...defaultProps} />)

      // Check that email is displayed
      expect(screen.getByText('invite1@example.com')).toBeInTheDocument()
      expect(screen.getByText('invite2@example.com')).toBeInTheDocument()

      // Check that roles are displayed
      expect(screen.getByText('teams.roles.member')).toBeInTheDocument()
      expect(screen.getByText('teams.roles.admin')).toBeInTheDocument()

      // Check that dates are displayed
      expect(screen.getByText('January 8, 2024')).toBeInTheDocument()
      expect(screen.getByText('January 9, 2024')).toBeInTheDocument()
    })
  })
})
