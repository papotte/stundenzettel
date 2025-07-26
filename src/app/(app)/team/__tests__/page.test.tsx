import React from 'react'

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useRouter } from 'next/navigation'

import { AuthProvider } from '@/context/auth-context'
import type {
  Subscription,
  Team,
  TeamInvitation,
  TeamMember,
} from '@/lib/types'
// Import mocked services
import {
  getTeamInvitations,
  getTeamMembers,
  getTeamSubscription,
  getUserInvitations,
  getUserTeam,
} from '@/services/team-service'
import { createMockAuthContext, createMockUser } from '@/test-utils/auth-mocks'

import TeamPage from '../page'

// Mock Next.js router
const mockSearchParams = new URLSearchParams()
const mockPathname = '/team'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
    push: jest.fn(),
  })),
  useSearchParams: jest.fn(() => mockSearchParams),
  usePathname: jest.fn(() => mockPathname),
}))

// Mock team service
jest.mock('@/services/team-service', () => ({
  getUserTeam: jest.fn(),
  getTeamMembers: jest.fn(),
  getTeamInvitations: jest.fn(),
  getUserInvitations: jest.fn(),
  getTeamSubscription: jest.fn(),
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
  replace: jest.fn(),
}

// Use centralized auth mock
const mockAuthContext = createMockAuthContext()
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>)
}

// Mock data
const mockTeam: Team = {
  id: 'team-1',
  name: 'Test Team',
  description: 'A test team',
  ownerId: 'test-user-id',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockMembers: TeamMember[] = [
  {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'owner',
    joinedAt: new Date('2024-01-01'),
    invitedBy: 'test-user-id',
  },
  {
    id: 'member-2',
    email: 'member2@example.com',
    role: 'member',
    joinedAt: new Date('2024-01-02'),
    invitedBy: 'test-user-id',
  },
]

const mockInvitations: TeamInvitation[] = [
  {
    id: 'invitation-1',
    teamId: 'team-1',
    email: 'invite@example.com',
    role: 'member',
    invitedBy: 'test-user-id',
    invitedAt: new Date('2024-01-01'),
    expiresAt: new Date('2024-01-08'),
    status: 'pending',
  },
]

const mockUserInvitations: TeamInvitation[] = [
  {
    id: 'user-invitation-1',
    teamId: 'team-2',
    email: 'test@example.com',
    role: 'member',
    invitedBy: 'other-user',
    invitedAt: new Date('2024-01-01'),
    expiresAt: new Date('2024-01-08'),
    status: 'pending',
  },
]

const mockSubscription: Subscription = {
  stripeSubscriptionId: 'sub_123',
  stripeCustomerId: 'cus_123',
  status: 'active',
  currentPeriodStart: new Date('2024-01-01'),
  cancelAtPeriodEnd: false,
  priceId: 'price_123',
  planName: 'Team Plan',
  planDescription: 'Team subscription',
  quantity: 5,
  updatedAt: new Date('2024-01-01'),
}

describe('TeamPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    // Reset auth context to authenticated state
    mockAuthContext.user = createMockUser()
    mockAuthContext.loading = false

    // Reset service mocks
    ;(getUserTeam as jest.Mock).mockResolvedValue(null)
    ;(getTeamMembers as jest.Mock).mockResolvedValue([])
    ;(getTeamInvitations as jest.Mock).mockResolvedValue([])
    ;(getUserInvitations as jest.Mock).mockResolvedValue([])
    ;(getTeamSubscription as jest.Mock).mockResolvedValue(null)
  })

  describe('Authentication', () => {
    it('redirects to login when user is not authenticated', async () => {
      mockAuthContext.user = null

      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith(
          '/login?returnUrl=/team',
        )
      })
    })

    it('shows loading skeleton when auth is loading', () => {
      mockAuthContext.loading = true
      mockAuthContext.user = null

      renderWithProviders(<TeamPage />)

      expect(screen.getAllByTestId('skeleton')).toHaveLength(2)
    })

    it('shows loading skeleton when page is loading', () => {
      renderWithProviders(<TeamPage />)

      expect(screen.getAllByTestId('skeleton')).toHaveLength(2)
    })
  })

  describe('No Team Scenario', () => {
    beforeEach(() => {
      ;(getUserTeam as jest.Mock).mockResolvedValue(null)
      ;(getUserInvitations as jest.Mock).mockResolvedValue([])
    })

    it('shows create team interface when user has no team', async () => {
      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        expect(screen.getByText('teams.title')).toBeInTheDocument()
        expect(screen.getByText('teams.subtitle')).toBeInTheDocument()
        expect(screen.getByText('teams.noTeamYet')).toBeInTheDocument()
        expect(screen.getByText('teams.noTeamDescription')).toBeInTheDocument()
      })
    })

    it('shows pending invitations when user has invitations', async () => {
      ;(getUserInvitations as jest.Mock).mockResolvedValue(mockUserInvitations)

      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        expect(screen.getByText('teams.pendingInvitations')).toBeInTheDocument()
        expect(
          screen.getByText('teams.pendingInvitationsDescription'),
        ).toBeInTheDocument()
      })
    })

    it('does not show pending invitations section when user has no invitations', async () => {
      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        expect(screen.getByText('teams.title')).toBeInTheDocument()
        expect(
          screen.queryByText('teams.pendingInvitations'),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Has Team Scenario', () => {
    beforeEach(() => {
      ;(getUserTeam as jest.Mock).mockResolvedValue(mockTeam)
      ;(getTeamMembers as jest.Mock).mockResolvedValue(mockMembers)
      ;(getTeamInvitations as jest.Mock).mockResolvedValue(mockInvitations)
      ;(getTeamSubscription as jest.Mock).mockResolvedValue(mockSubscription)
    })

    it('shows team management interface when user has a team', async () => {
      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Team')).toBeInTheDocument()
        expect(screen.getByText('A test team')).toBeInTheDocument()
        expect(screen.getByText('teams.teamMembers')).toBeInTheDocument()
        expect(screen.getByText(/teams.pendingInvitationsTab/i)).toBeVisible()
        expect(screen.getByText('teams.subscription')).toBeInTheDocument()
      })
    })

    it('shows team settings button for team owner', async () => {
      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        expect(screen.getByText('teams.settings')).toBeInTheDocument()
      })
    })

    it('shows invite member button for team owner', async () => {
      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'teams.inviteMember' }),
        ).toBeInTheDocument()
      })
    })

    it('shows members tab content', async () => {
      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        expect(screen.getByText('teams.teamMembers')).toBeInTheDocument()
        expect(
          screen.getByText('teams.teamMembersDescription'),
        ).toBeInTheDocument()
      })
    })

    it('shows invitations tab content for admin/owner', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Team')).toBeInTheDocument()
      })

      // Click on invitations tab to show the content
      const invitationsTab = screen.getByRole('tab', {
        name: /teams.pendingInvitationsTab/i,
      })
      await user.click(invitationsTab)

      await waitFor(() => {
        expect(
          screen.getByText('teams.pendingInvitationsTab'),
        ).toBeInTheDocument()
        expect(
          screen.getByText('teams.pendingInvitationsTabDescription'),
        ).toBeInTheDocument()
      })
    })

    it('shows subscription tab content', async () => {
      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        expect(screen.getByText('teams.subscription')).toBeInTheDocument()
      })
    })

    it('handles tab switching', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        expect(screen.getByText('teams.teamMembers')).toBeInTheDocument()
      })

      // Click on subscription tab
      const subscriptionTab = screen.getByRole('tab', {
        name: /teams.subscription/i,
      })
      await user.click(subscriptionTab)

      // Should show subscription content
      await waitFor(() => {
        expect(screen.getByText('teams.subscription')).toBeInTheDocument()
      })
    })
  })

  describe('Member Role Scenarios', () => {
    it('hides admin features for regular members', async () => {
      mockAuthContext.user = createMockUser({ uid: 'member-user' })

      const memberTeam = { ...mockTeam, ownerId: 'other-user' }
      const memberMembers = [
        {
          id: 'member-user',
          email: 'member@example.com',
          role: 'member' as const,
          joinedAt: new Date('2024-01-01'),
          invitedBy: 'other-user',
        },
      ]

      ;(getUserTeam as jest.Mock).mockResolvedValue(memberTeam)
      ;(getTeamMembers as jest.Mock).mockResolvedValue(memberMembers)
      ;(getTeamInvitations as jest.Mock).mockResolvedValue([])

      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Team')).toBeInTheDocument()
        expect(
          screen.queryByText('teams.pendingInvitationsTab'),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByRole('button', { name: 'teams.inviteMember' }),
        ).not.toBeInTheDocument()
      })
    })

    it('shows admin features for admin users', async () => {
      mockAuthContext.user = createMockUser({ uid: 'admin-user' })

      const adminTeam = { ...mockTeam, ownerId: 'other-user' }
      const adminMembers = [
        {
          id: 'admin-user',
          email: 'admin@example.com',
          role: 'admin' as const,
          joinedAt: new Date('2024-01-01'),
          invitedBy: 'other-user',
        },
      ]

      ;(getUserTeam as jest.Mock).mockResolvedValue(adminTeam)
      ;(getTeamMembers as jest.Mock).mockResolvedValue(adminMembers)
      ;(getTeamInvitations as jest.Mock).mockResolvedValue([])

      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Team')).toBeInTheDocument()
        expect(
          screen.getByText(/teams.pendingInvitationsTab/i),
        ).toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: 'teams.inviteMember' }),
        ).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('shows back to tracker button', async () => {
      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        expect(screen.getByText('settings.backToTracker')).toBeInTheDocument()
      })
    })

    it('back button links to tracker page', async () => {
      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        const backButton = screen.getByRole('link', {
          name: /settings\.backToTracker/i,
        })
        expect(backButton).toHaveAttribute('href', '/tracker')
      })
    })
  })

  describe('Error Handling', () => {
    it('handles service errors gracefully', async () => {
      ;(getUserTeam as jest.Mock).mockRejectedValue(new Error('Service error'))

      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        // Should still show the page structure even if data loading fails
        expect(screen.getByText('settings.backToTracker')).toBeInTheDocument()
      })
    })

    it('handles partial service errors', async () => {
      ;(getUserTeam as jest.Mock).mockResolvedValue(mockTeam)
      ;(getTeamMembers as jest.Mock).mockRejectedValue(
        new Error('Members error'),
      )

      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        // Should still show the team structure even if some data fails to load
        expect(screen.getByText('Test Team')).toBeInTheDocument()
      })
    })
  })

  describe('Data Loading States', () => {
    it('shows loading state while fetching team data', () => {
      // Don't resolve the promise immediately to test loading state
      ;(getUserTeam as jest.Mock).mockImplementation(
        () => new Promise(() => {}),
      )

      renderWithProviders(<TeamPage />)

      expect(screen.getAllByTestId('skeleton')).toHaveLength(2)
    })

    it('transitions from loading to loaded state', async () => {
      let resolveTeam: (value: Team | null) => void
      const teamPromise = new Promise<Team | null>((resolve) => {
        resolveTeam = resolve
      })
      ;(getUserTeam as jest.Mock).mockReturnValue(teamPromise)

      renderWithProviders(<TeamPage />)

      // Should show loading initially
      expect(screen.getAllByTestId('skeleton')).toHaveLength(2)

      // Resolve the promise
      resolveTeam!(mockTeam)
      ;(getTeamMembers as jest.Mock).mockResolvedValue(mockMembers)
      ;(getTeamInvitations as jest.Mock).mockResolvedValue([])
      ;(getTeamSubscription as jest.Mock).mockResolvedValue(null)

      // Should show team data after loading
      await waitFor(() => {
        expect(screen.getByText('Test Team')).toBeInTheDocument()
      })
    })
  })

  describe('Team Creation Flow', () => {
    it('shows create team dialog when user has no team', async () => {
      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        expect(screen.getByText('teams.noTeamYet')).toBeInTheDocument()
        expect(screen.getByText('teams.noTeamDescription')).toBeInTheDocument()
      })
    })

    it('handles team creation callback', async () => {
      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        expect(screen.getByText('teams.noTeamYet')).toBeInTheDocument()
      })

      expect(screen.getByText('teams.createTeam')).toBeInTheDocument()
    })
  })

  describe('Team Management Features', () => {
    beforeEach(() => {
      ;(getUserTeam as jest.Mock).mockResolvedValue(mockTeam)
      ;(getTeamMembers as jest.Mock).mockResolvedValue(mockMembers)
      ;(getTeamInvitations as jest.Mock).mockResolvedValue(mockInvitations)
      ;(getTeamSubscription as jest.Mock).mockResolvedValue(mockSubscription)
    })

    it('displays team information correctly', async () => {
      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Team')).toBeInTheDocument()
        expect(screen.getByText('A test team')).toBeInTheDocument()
      })
    })

    it('shows member count in tab', async () => {
      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        expect(screen.getByText('teams.teamMembers (2)')).toBeInTheDocument()
      })
    })

    it('shows invitation count in tab', async () => {
      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        expect(
          screen.getByText('teams.pendingInvitationsTab (1)'),
        ).toBeInTheDocument()
      })
    })

    it('handles empty team description', async () => {
      const teamWithoutDescription = { ...mockTeam, description: undefined }
      ;(getUserTeam as jest.Mock).mockResolvedValue(teamWithoutDescription)

      renderWithProviders(<TeamPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Team')).toBeInTheDocument()
        expect(
          screen.getByText('teams.noDescriptionProvided'),
        ).toBeInTheDocument()
      })
    })
  })
})
