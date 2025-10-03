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
  expiresAt: new Date('2025-01-01'), // Future date
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
    it('shows loading skeleton while fetching invitation', () => {
      mockAuthContext.loading = true
      renderWithProviders(<InvitationPage />)

      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
    })

    it('shows loading skeleton while auth is loading', () => {
      mockAuthContext.loading = true
      mockAuthContext.user = null
      renderWithProviders(<InvitationPage />)

      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
    })
  })

  describe('Unauthenticated Users', () => {
    it('prompts unauthenticated users to log in', async () => {
      mockAuthContext.user = null
      mockAuthContext.loading = false

      renderWithProviders(<InvitationPage />)

      await waitFor(() => {
        expect(screen.getByText(/Team Invitation/i)).toBeInTheDocument()
        expect(
          screen.getByText(/Please log in to accept or decline/i),
        ).toBeInTheDocument()
      })

      expect(screen.getByRole('link', { name: /Sign In/i })).toHaveAttribute(
        'href',
        '/login',
      )
    })
  })

  describe('Valid Invitation', () => {
    beforeEach(() => {
      ;(getTeamInvitation as jest.Mock).mockResolvedValue(mockInvitation)
      ;(getTeam as jest.Mock).mockResolvedValue(mockTeam)
    })

    it('displays invitation details correctly', async () => {
      renderWithProviders(<InvitationPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Team')).toBeInTheDocument()
      })

      expect(screen.getByText(/member/i)).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Accept/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Decline/i })).toBeInTheDocument()
    })

    it('accepts invitation and redirects to team page', async () => {
      ;(acceptTeamInvitation as jest.Mock).mockResolvedValue(undefined)

      renderWithProviders(<InvitationPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Team')).toBeInTheDocument()
      })

      const acceptButton = screen.getByRole('button', { name: /Accept/i })
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

      const declineButton = screen.getByRole('button', { name: /Decline/i })
      await userEvent.click(declineButton)

      await waitFor(() => {
        expect(declineTeamInvitation).toHaveBeenCalledWith(
          'test-invitation-123',
        )
        expect(mockRouter.push).toHaveBeenCalledWith('/team')
      })
    })
  })

  describe('Email Mismatch', () => {
    it('shows warning when logged-in email does not match invitation', async () => {
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
        screen.getByText(/This invitation was sent to different@example.com/i),
      ).toBeInTheDocument()

      const acceptButton = screen.getByRole('button', { name: /Accept/i })
      expect(acceptButton).toBeDisabled()
    })
  })

  describe('Expired Invitation', () => {
    it('shows expired message for expired invitations', async () => {
      ;(getTeamInvitation as jest.Mock).mockResolvedValue(mockExpiredInvitation)
      ;(getTeam as jest.Mock).mockResolvedValue(mockTeam)

      renderWithProviders(<InvitationPage />)

      await waitFor(() => {
        expect(
          screen.getByText(/This invitation has expired/i),
        ).toBeInTheDocument()
      })

      expect(
        screen.queryByRole('button', { name: /Accept/i }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /Decline/i }),
      ).not.toBeInTheDocument()
    })
  })

  describe('Invalid Invitation', () => {
    it('shows error when invitation not found', async () => {
      ;(getTeamInvitation as jest.Mock).mockResolvedValue(null)

      renderWithProviders(<InvitationPage />)

      await waitFor(() => {
        expect(
          screen.getByText(/This invitation could not be found/i),
        ).toBeInTheDocument()
      })

      expect(
        screen.getByRole('link', { name: /Go to Team Page/i }),
      ).toHaveAttribute('href', '/team')
    })

    it('shows error for already processed invitations', async () => {
      const processedInvitation = {
        ...mockInvitation,
        status: 'accepted' as const,
      }
      ;(getTeamInvitation as jest.Mock).mockResolvedValue(processedInvitation)
      ;(getTeam as jest.Mock).mockResolvedValue(mockTeam)

      renderWithProviders(<InvitationPage />)

      await waitFor(() => {
        expect(
          screen.getByText(/already been accepted or declined/i),
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
        expect(screen.getByText(/Failed to load invitation/i)).toBeInTheDocument()
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

      const acceptButton = screen.getByRole('button', { name: /Accept/i })
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
