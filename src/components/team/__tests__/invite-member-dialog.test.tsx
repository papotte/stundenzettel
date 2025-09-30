import React from 'react'

import { render, screen, waitFor } from '@jest-setup'
import userEvent from '@testing-library/user-event'

import { useToast } from '@/hooks/use-toast'
// Import mocked services
import { createTeamInvitation } from '@/services/team-service'

import { InviteMemberDialog } from '../invite-member-dialog'

// Mock the team service
jest.mock('@/services/team-service', () => ({
  createTeamInvitation: jest.fn(),
}))

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}))

const mockToast = {
  toast: jest.fn(),
}

const mockCreateTeamInvitation = jest.fn()
new Date('2024-01-01')
new Date('2024-01-08')
const defaultProps = {
  teamId: 'team-1',
  invitedBy: 'user-1',
  onInvitationSent: jest.fn(),
}

describe('InviteMemberDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useToast as jest.Mock).mockReturnValue(mockToast)
    ;(createTeamInvitation as jest.Mock).mockImplementation(
      mockCreateTeamInvitation,
    )
  })

  describe('Dialog Trigger', () => {
    it('renders invite member button', () => {
      render(<InviteMemberDialog {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: /teams.inviteMember/i }),
      ).toBeInTheDocument()
    })

    it('opens dialog when invite button is clicked', async () => {
      const user = userEvent.setup()
      render(<InviteMemberDialog {...defaultProps} />)

      const inviteButton = screen.getByRole('button', {
        name: /teams.inviteMember/i,
      })
      await user.click(inviteButton)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('teams.inviteMemberTitle')).toBeInTheDocument()
    })
  })

  describe('Dialog Content', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<InviteMemberDialog {...defaultProps} />)

      const inviteButton = screen.getByRole('button', {
        name: /teams.inviteMember/i,
      })
      await user.click(inviteButton)
    })

    it('displays dialog title and description', () => {
      expect(screen.getByText('teams.inviteMemberTitle')).toBeInTheDocument()
      expect(
        screen.getByText('teams.inviteMemberDescription'),
      ).toBeInTheDocument()
    })

    it('renders email input field', () => {
      expect(screen.getByLabelText('teams.emailAddress')).toBeInTheDocument()
    })

    it('renders role selection', () => {
      expect(screen.getByLabelText('teams.role')).toBeInTheDocument()
    })

    it('renders cancel and invite buttons', () => {
      expect(
        screen.getByRole('button', { name: /common.cancel/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /teams.sendInvitation/i }),
      ).toBeInTheDocument()
    })

    it('shows default role as member', () => {
      const roleSelect = screen.getByLabelText('teams.role')
      expect(roleSelect).toHaveTextContent('teams.member')
    })
  })

  describe('Form Validation', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<InviteMemberDialog {...defaultProps} />)

      const inviteButton = screen.getByRole('button', {
        name: /teams.inviteMember/i,
      })
      await user.click(inviteButton)
    })

    it('shows error when submitting empty form', async () => {
      const user = userEvent.setup()
      const inviteButton = screen.getByRole('button', {
        name: /teams.sendInvitation/i,
      })

      await user.click(inviteButton)

      await waitFor(() => {
        expect(
          screen.getByText('teams.pleaseEnterValidEmail'),
        ).toBeInTheDocument()
      })
    })

    it('allows submission with valid email and member role', async () => {
      const user = userEvent.setup()
      mockCreateTeamInvitation.mockResolvedValue('invitation-1')

      const emailInput = screen.getByLabelText('teams.emailAddress')
      await user.type(emailInput, 'test@example.com')

      const inviteButton = screen.getByRole('button', {
        name: /teams.sendInvitation/i,
      })
      await user.click(inviteButton)

      await waitFor(() => {
        expect(mockCreateTeamInvitation).toHaveBeenCalledWith(
          'team-1',
          'test@example.com',
          'member',
          'user-1',
        )
      })
    })

    it('allows submission with admin role', async () => {
      const user = userEvent.setup()
      mockCreateTeamInvitation.mockResolvedValue('invitation-1')

      const emailInput = screen.getByLabelText('teams.emailAddress')
      await user.type(emailInput, 'admin@example.com')

      const roleSelect = screen.getByLabelText('teams.role')
      await user.click(roleSelect)
      const adminOption = screen.getByRole('option', { name: 'teams.admin' })
      await user.click(adminOption)

      const inviteButton = screen.getByRole('button', {
        name: /teams.sendInvitation/i,
      })
      await user.click(inviteButton)

      await waitFor(() => {
        expect(mockCreateTeamInvitation).toHaveBeenCalledWith(
          'team-1',
          'admin@example.com',
          'admin',
          'user-1',
        )
      })
    })
  })

  describe('Invitation Flow', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<InviteMemberDialog {...defaultProps} />)

      const inviteButton = screen.getByRole('button', {
        name: /teams.inviteMember/i,
      })
      await user.click(inviteButton)
    })

    it('successfully sends invitation and calls callback', async () => {
      const user = userEvent.setup()
      mockCreateTeamInvitation.mockResolvedValue('invitation-1')

      const emailInput = screen.getByLabelText('teams.emailAddress')
      await user.type(emailInput, 'test@example.com')

      const inviteButton = screen.getByRole('button', {
        name: /teams.sendInvitation/i,
      })
      await user.click(inviteButton)

      await waitFor(() => {
        expect(defaultProps.onInvitationSent).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'invitation-1',
            teamId: 'team-1',
            email: 'test@example.com',
            role: 'member',
            invitedBy: 'user-1',
            status: 'pending',
          }),
        )
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'teams.invitationSent',
          description: 'teams.invitationSentDescription',
        })
      })
    })

    it('closes dialog after successful invitation', async () => {
      const user = userEvent.setup()
      mockCreateTeamInvitation.mockResolvedValue('invitation-1')

      const emailInput = screen.getByLabelText('teams.emailAddress')
      await user.type(emailInput, 'test@example.com')

      const inviteButton = screen.getByRole('button', {
        name: /teams.sendInvitation/i,
      })
      await user.click(inviteButton)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('resets form after successful invitation', async () => {
      const user = userEvent.setup()
      mockCreateTeamInvitation.mockResolvedValue('invitation-1')

      const emailInput = screen.getByLabelText('teams.emailAddress')
      const roleSelect = screen.getByLabelText('teams.role')

      await user.type(emailInput, 'test@example.com')
      await user.click(roleSelect)
      const adminOption = screen.getByRole('option', { name: 'teams.admin' })
      await user.click(adminOption)

      const inviteButton = screen.getByRole('button', {
        name: /teams.sendInvitation/i,
      })
      await user.click(inviteButton)

      // Reopen dialog to check if form is reset
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      const inviteButtonAgain = screen.getByRole('button', {
        name: /teams.inviteMember/i,
      })
      await user.click(inviteButtonAgain)

      expect(screen.getByLabelText('teams.emailAddress')).toHaveValue('')
      expect(screen.getByLabelText('teams.role')).toHaveTextContent(
        'teams.member',
      )
    })
  })

  describe('Error Handling', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<InviteMemberDialog {...defaultProps} />)

      const inviteButton = screen.getByRole('button', {
        name: /teams.inviteMember/i,
      })
      await user.click(inviteButton)
    })

    it('handles invitation sending error', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Failed to send invitation'
      mockCreateTeamInvitation.mockRejectedValue(new Error(errorMessage))

      const emailInput = screen.getByLabelText('teams.emailAddress')
      await user.type(emailInput, 'test@example.com')

      const inviteButton = screen.getByRole('button', {
        name: /teams.sendInvitation/i,
      })
      await user.click(inviteButton)

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
      mockCreateTeamInvitation.mockRejectedValue('Unknown error')

      const emailInput = screen.getByLabelText('teams.emailAddress')
      await user.type(emailInput, 'test@example.com')

      const inviteButton = screen.getByRole('button', {
        name: /teams.sendInvitation/i,
      })
      await user.click(inviteButton)

      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'common.error',
          description: 'teams.failedToSendInvitation',
          variant: 'destructive',
        })
      })
    })
  })

  describe('Loading States', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<InviteMemberDialog {...defaultProps} />)

      const inviteButton = screen.getByRole('button', {
        name: /teams.inviteMember/i,
      })
      await user.click(inviteButton)
    })

    it('shows loading state during invitation sending', async () => {
      const user = userEvent.setup()
      let resolveInvite: (value: string) => void
      const invitePromise = new Promise<string>((resolve) => {
        resolveInvite = resolve
      })
      mockCreateTeamInvitation.mockReturnValue(invitePromise)

      const emailInput = screen.getByLabelText('teams.emailAddress')
      await user.type(emailInput, 'test@example.com')

      const inviteButton = screen.getByRole('button', {
        name: /teams.sendInvitation/i,
      })
      await user.click(inviteButton)

      // Should show loading state
      expect(
        screen.getByRole('button', { name: /teams.sending/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /teams.sending/i }),
      ).toBeDisabled()

      // Resolve the promise
      resolveInvite!('invitation-1')

      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: /teams.sending/i }),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Dialog Actions', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<InviteMemberDialog {...defaultProps} />)

      const inviteButton = screen.getByRole('button', {
        name: /teams.inviteMember/i,
      })
      await user.click(inviteButton)
    })

    it('closes dialog when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const cancelButton = screen.getByRole('button', {
        name: /common.cancel/i,
      })

      await user.click(cancelButton)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Role Selection', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<InviteMemberDialog {...defaultProps} />)

      const inviteButton = screen.getByRole('button', {
        name: /teams.inviteMember/i,
      })
      await user.click(inviteButton)
    })

    it('allows selecting member role', async () => {
      const user = userEvent.setup()
      const roleSelect = screen.getByLabelText('teams.role')

      await user.click(roleSelect)
      const memberOption = screen.getByRole('option', { name: 'teams.member' })
      await user.click(memberOption)

      expect(roleSelect).toHaveTextContent('teams.member')
    })

    it('allows selecting admin role', async () => {
      const user = userEvent.setup()
      const roleSelect = screen.getByLabelText('teams.role')

      await user.click(roleSelect)
      const adminOption = screen.getByRole('option', { name: 'teams.admin' })
      await user.click(adminOption)

      expect(roleSelect).toHaveTextContent('teams.admin')
    })

    it('sends invitation with selected role', async () => {
      const user = userEvent.setup()
      mockCreateTeamInvitation.mockResolvedValue('invitation-1')

      const emailInput = screen.getByLabelText('teams.emailAddress')
      const roleSelect = screen.getByLabelText('teams.role')

      await user.type(emailInput, 'admin@example.com')
      await user.click(roleSelect)
      const adminOption = screen.getByRole('option', { name: 'teams.admin' })
      await user.click(adminOption)

      const inviteButton = screen.getByRole('button', {
        name: /teams.sendInvitation/i,
      })
      await user.click(inviteButton)

      await waitFor(() => {
        expect(mockCreateTeamInvitation).toHaveBeenCalledWith(
          'team-1',
          'admin@example.com',
          'admin',
          'user-1',
        )
      })
    })
  })
})
