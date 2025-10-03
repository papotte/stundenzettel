import React from 'react'

import { render, screen, waitFor } from '@jest-setup'
import userEvent from '@testing-library/user-event'

import { useParams, useRouter } from 'next/navigation'

import type { Team, TeamInvitation } from '@/lib/types'
import {
  acceptTeamInvitation,
  declineTeamInvitation,
  getTeam,
  getTeamInvitation,
} from '@/services/team-service'
import { createMockAuthContext, createMockUser } from '@/test-utils/auth-mocks'

import InvitationPage from '../page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  useParams: jest.fn(() => ({
    invitationId: 'test-invitation-123',
  })),
}))

// Mock team service
jest.mock('@/services/team-service', () => ({
  getTeamInvitation: jest.fn(),
  getTeam: jest.fn(),
  acceptTeamInvitation: jest.fn(),
  declineTeamInvitation: jest.fn(),
}))

// Mock hooks
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

jest.mock('@/hooks/use-user-invitations', () => ({
  useUserInvitations: () => ({
    refreshInvitations: jest.fn(),
  }),
}))

const mockRouter = {
  push: jest.fn(),
}

const mockAuthContext = createMockAuthContext()
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(component)
}

// Mock data
const mockTeam: Team = {
  id: 'team-123',
  name: 'Test Team',
  description: 'A test team',
  ownerId: 'owner-123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockInvitation: TeamInvitation = {
  id: 'test-invitation-123',
  teamId: 'team-123',
  email: 'test@example.com',
  role: 'member',
  invitedBy: 'owner-123',
  invitedAt: new Date('2024-01-01'),
  expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
  status: 'pending',
}

const mockExpiredInvitation: TeamInvitation = {
  ...mockInvitation,
  expiresAt: new Date('2023-01-01'), // Past date
}

describe('InvitationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useParams as jest.Mock).mockReturnValue({
      invitationId: 'test-invitation-123',
    })
    mockAuthContext.user = createMockUser({
      email: 'test@example.com',
    })
    mockAuthContext.loading = false
  })

  describe('Loading States', () => {
    it('shows loading skeleton during auth and invitation loading', () => {
      // Test auth loading
      mockAuthContext.loading = true
      mockAuthContext.user = null
      const { rerender } = renderWithProviders(<InvitationPage />)
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)

      // Test invitation loading
      mockAuthContext.loading = false
      mockAuthContext.user = createMockUser({ email: 'test@example.com' })
      rerender(<InvitationPage />)
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
    })
  })

  describe('Unauthenticated Users', () => {
    it('prompts unauthenticated users to log in', async () => {
      mockAuthContext.user = null
      mockAuthContext.loading = false

      renderWithProviders(<InvitationPage />)

      await waitFor(() => {
        expect(screen.getByText('teams.teamInvitation')).toBeInTheDocument()
        expect(
          screen.getByText('teams.loginToAcceptInvitation'),
        ).toBeInTheDocument()
      })

      expect(
        screen.getByRole('link', { name: 'login.signInButton' }),
      ).toHaveAttribute('href', '/login')
    })
  })

  describe('Valid Invitation', () => {
    beforeEach(() => {
      ;(getTeamInvitation as jest.Mock).mockResolvedValue(mockInvitation)
      ;(getTeam as jest.Mock).mockResolvedValue(mockTeam)
    })

    it('displays invitation details correctly', async () => {
      renderWithProviders(<InvitationPage />)

      // Verify invitation details are displayed
      await waitFor(() => {
        expect(screen.getByText('Test Team')).toBeInTheDocument()
      })

      expect(screen.getByText('teams.roles.member')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'teams.acceptInvitation' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'teams.declineInvitation' }),
      ).toBeInTheDocument()
    })

    it('accepts invitation and redirects to team page', async () => {
      ;(acceptTeamInvitation as jest.Mock).mockResolvedValue(undefined)

      renderWithProviders(<InvitationPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Team')).toBeInTheDocument()
      })

      const acceptButton = screen.getByRole('button', {
        name: 'teams.acceptInvitation',
      })
      await userEvent.click(acceptButton)

      await waitFor(() => {
        expect(acceptTeamInvitation).toHaveBeenCalledWith(
          'test-invitation-123',
          'test-user-id',
          'test@example.com',
        )
        expect(mockRouter.push).toHaveBeenCalledWith('/team')
      })
    })

    it('declines invitation and redirects to team page', async () => {
      ;(declineTeamInvitation as jest.Mock).mockResolvedValue(undefined)

      renderWithProviders(<InvitationPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Team')).toBeInTheDocument()
      })

      const declineButton = screen.getByRole('button', {
        name: 'teams.declineInvitation',
      })
      await userEvent.click(declineButton)

      await waitFor(() => {
        expect(declineTeamInvitation).toHaveBeenCalledWith(
          'test-invitation-123',
        )
        expect(mockRouter.push).toHaveBeenCalledWith('/team')
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles email mismatch', async () => {
      const differentEmailInvitation = {
        ...mockInvitation,
        email: 'different@example.com',
      }
      ;(getTeamInvitation as jest.Mock).mockResolvedValue(
        differentEmailInvitation,
      )
      ;(getTeam as jest.Mock).mockResolvedValue(mockTeam)

      renderWithProviders(<InvitationPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Team')).toBeInTheDocument()
      })

      expect(
        screen.getByText('teams.invitationEmailWarning'),
      ).toBeInTheDocument()

      const acceptButton = screen.getByRole('button', {
        name: 'teams.acceptInvitation',
      })
      expect(acceptButton).toBeDisabled()
    })

    it('handles expired invitations', async () => {
      ;(getTeamInvitation as jest.Mock).mockResolvedValue(mockExpiredInvitation)
      ;(getTeam as jest.Mock).mockResolvedValue(mockTeam)

      renderWithProviders(<InvitationPage />)

      await waitFor(() => {
        expect(
          screen.getByText('teams.invitationExpiredDescription'),
        ).toBeInTheDocument()
      })

      expect(
        screen.queryByRole('button', { name: 'teams.acceptInvitation' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'teams.declineInvitation' }),
      ).not.toBeInTheDocument()
    })

    it('handles invalid invitations', async () => {
      ;(getTeamInvitation as jest.Mock).mockResolvedValue(null)

      renderWithProviders(<InvitationPage />)

      await waitFor(() => {
        expect(screen.getByText('teams.invitationNotFound')).toBeInTheDocument()
      })

      expect(
        screen.getByRole('link', { name: 'teams.goToTeamPage' }),
      ).toHaveAttribute('href', '/team')
    })

    it('handles already processed invitations', async () => {
      const processedInvitation = {
        ...mockInvitation,
        status: 'accepted' as const,
      }
      ;(getTeamInvitation as jest.Mock).mockResolvedValue(processedInvitation)
      ;(getTeam as jest.Mock).mockResolvedValue(mockTeam)

      renderWithProviders(<InvitationPage />)

      await waitFor(() => {
        expect(
          screen.getByText('teams.invitationAlreadyProcessed'),
        ).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles errors when loading invitation', async () => {
      ;(getTeamInvitation as jest.Mock).mockRejectedValue(
        new Error('Failed to load'),
      )

      renderWithProviders(<InvitationPage />)

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load invitation'),
        ).toBeInTheDocument()
      })
    })

    it('handles errors when accepting invitation', async () => {
      ;(getTeamInvitation as jest.Mock).mockResolvedValue(mockInvitation)
      ;(getTeam as jest.Mock).mockResolvedValue(mockTeam)
      ;(acceptTeamInvitation as jest.Mock).mockRejectedValue(
        new Error('Failed to accept'),
      )

      renderWithProviders(<InvitationPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Team')).toBeInTheDocument()
      })

      const acceptButton = screen.getByRole('button', {
        name: 'teams.acceptInvitation',
      })
      await userEvent.click(acceptButton)

      await waitFor(() => {
        expect(acceptTeamInvitation).toHaveBeenCalled()
      })

      // Button should be enabled again after error
      await waitFor(() => {
        expect(acceptButton).not.toBeDisabled()
      })
    })
  })
})
