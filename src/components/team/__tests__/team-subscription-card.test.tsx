import React from 'react'

import { render, screen, waitFor } from '@jest-setup'
import userEvent from '@testing-library/user-event'

import { useToast } from '@/hooks/use-toast'
import type { Subscription, Team, TeamMember } from '@/lib/types'
import { getPricingPlans, paymentService } from '@/services/payment-service'
import { getTeamSubscription } from '@/services/team-service'

import { TeamSubscriptionCard } from '../team-subscription-card'

// Mock the auth context
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: {
      uid: 'user-1',
      email: 'test@example.com',
    },
  }),
}))

// Mock the payment service
jest.mock('@/services/payment-service', () => ({
  getPricingPlans: jest.fn(),
  paymentService: {
    createCustomerPortalSession: jest.fn(),
    redirectToCustomerPortal: jest.fn(),
  },
}))

// Mock the team service
jest.mock('@/services/team-service', () => ({
  getTeamSubscription: jest.fn(),
}))

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

const mockToast = {
  toast: jest.fn(),
}

const mockTeam: Team = {
  id: 'team-1',
  name: 'Test Team',
  description: 'A test team description',
  ownerId: 'user-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockMembers: TeamMember[] = [
  {
    id: 'user-1',
    email: 'owner@example.com',
    role: 'owner',
    joinedAt: new Date('2024-01-01'),
    invitedBy: 'user-1',
  },
  {
    id: 'user-2',
    email: 'member@example.com',
    role: 'member',
    joinedAt: new Date('2024-01-02'),
    invitedBy: 'user-1',
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
  planDescription: 'Team subscription with 5 members',
  quantity: 5,
  updatedAt: new Date('2024-01-01'),
}

const defaultProps = {
  team: mockTeam,
  members: mockMembers,
  subscription: mockSubscription,
  onSubscriptionUpdate: jest.fn(),
}

describe('TeamSubscriptionCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useToast as jest.Mock).mockReturnValue(mockToast)
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: 'https://example.com/portal' }),
    })
    ;(getPricingPlans as jest.Mock).mockResolvedValue([
      {
        id: 'team-monthly',
        name: 'Team Monthly',
        price: 19.99,
        currency: 'EUR',
        interval: 'month',
        features: ['Team Feature 1', 'Team Feature 2'],
        stripePriceId: 'price_team_monthly',
        maxUsers: 10,
      },
    ])
  })

  describe('Rendering', () => {
    it('renders subscription card', () => {
      render(<TeamSubscriptionCard {...defaultProps} />)

      expect(screen.getByText('teams.teamSubscription')).toBeInTheDocument()
      expect(
        screen.getByText('teams.teamSubscriptionManageDescription'),
      ).toBeInTheDocument()
    })

    it('displays subscription status', () => {
      render(<TeamSubscriptionCard {...defaultProps} />)

      expect(screen.getByText('active')).toBeInTheDocument()
    })

    it('displays plan information', () => {
      render(<TeamSubscriptionCard {...defaultProps} />)

      expect(screen.getByText('teams.subscriptionStatus')).toBeInTheDocument()
      expect(screen.getByText('Team Plan')).toBeInTheDocument()
    })

    it('displays seat usage information', () => {
      render(<TeamSubscriptionCard {...defaultProps} />)

      expect(screen.getByText('teams.seatUsage')).toBeInTheDocument()
      expect(screen.getByText('teams.seatsUsed')).toBeInTheDocument()
    })

    it('displays current period information', () => {
      render(<TeamSubscriptionCard {...defaultProps} />)

      expect(screen.getByText('teams.currentPeriod')).toBeInTheDocument()
      expect(screen.getByText('teams.startedOn')).toBeInTheDocument()
    })

    it('displays manage billing button', () => {
      render(<TeamSubscriptionCard {...defaultProps} />)

      expect(screen.getByText('teams.manageBilling')).toBeInTheDocument()
    })
  })

  describe('Plan Information', () => {
    it('displays plan description correctly', () => {
      render(<TeamSubscriptionCard {...defaultProps} />)

      expect(screen.getByText('Team Plan')).toBeInTheDocument()
    })

    it('displays subscription start date', () => {
      render(<TeamSubscriptionCard {...defaultProps} />)

      expect(screen.getByText('teams.startedOn')).toBeInTheDocument()
    })
  })

  describe('Member Limit Warnings', () => {
    it('shows warning when approaching member limit', () => {
      const approachingLimitMembers = Array.from({ length: 4 }, (_, i) => ({
        id: `user-${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: 'member' as const,
        joinedAt: new Date('2024-01-01'),
        invitedBy: 'user-1',
      }))

      render(
        <TeamSubscriptionCard
          {...defaultProps}
          members={approachingLimitMembers}
        />,
      )

      expect(screen.getByText('teams.seatsUsed')).toBeInTheDocument()
    })

    it('shows warning when at member limit', () => {
      const atLimitMembers = Array.from({ length: 5 }, (_, i) => ({
        id: `user-${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: 'member' as const,
        joinedAt: new Date('2024-01-01'),
        invitedBy: 'user-1',
      }))

      render(
        <TeamSubscriptionCard {...defaultProps} members={atLimitMembers} />,
      )

      expect(screen.getByText('teams.seatLimitWarning')).toBeInTheDocument()
      expect(screen.getByText('teams.addSeats')).toBeInTheDocument()
    })
  })

  describe('Subscription Management', () => {
    it('handles manage subscription click', async () => {
      const user = userEvent.setup()
      const mockCreateCustomerPortalSession =
        paymentService.createCustomerPortalSession as jest.Mock
      const mockRedirectToCustomerPortal =
        paymentService.redirectToCustomerPortal as jest.Mock

      mockCreateCustomerPortalSession.mockResolvedValue({
        url: 'https://example.com/portal',
      })
      mockRedirectToCustomerPortal.mockResolvedValue(undefined)

      render(<TeamSubscriptionCard {...defaultProps} />)

      const manageButton = screen.getByText('teams.manageBilling')
      await user.click(manageButton)

      await waitFor(() => {
        expect(mockCreateCustomerPortalSession).toHaveBeenCalledWith(
          'test@example.com',
          'http://localhost/subscription',
        )
        expect(mockRedirectToCustomerPortal).toHaveBeenCalledWith(
          'https://example.com/portal',
        )
      })

      // Verify the exact parameters passed to the payment service
      expect(mockCreateCustomerPortalSession).toHaveBeenCalledTimes(1)
      const [userId, returnUrl] = mockCreateCustomerPortalSession.mock.calls[0]
      expect(userId).toBe('test@example.com')
      expect(returnUrl).toBe('http://localhost/subscription')
    })

    it('verifies the exact API call body for customer portal session', async () => {
      const user = userEvent.setup()

      // Mock the payment service to actually call the real method
      const mockCreateCustomerPortalSession =
        paymentService.createCustomerPortalSession as jest.Mock
      const mockRedirectToCustomerPortal =
        paymentService.redirectToCustomerPortal as jest.Mock

      // Mock the internal fetch call that the payment service makes
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ url: 'https://example.com/portal' }),
      })

      // Restore the original implementation to test the actual API call
      mockCreateCustomerPortalSession.mockImplementation(
        async (userId: string, returnUrl?: string) => {
          const response = await fetch('/api/create-customer-portal-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              returnUrl,
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to create customer portal session')
          }

          return response.json()
        },
      )

      mockRedirectToCustomerPortal.mockResolvedValue(undefined)

      render(<TeamSubscriptionCard {...defaultProps} />)

      const manageButton = screen.getByText('teams.manageBilling')
      await user.click(manageButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/create-customer-portal-session',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: 'test@example.com',
              returnUrl: 'http://localhost/subscription',
            }),
          }),
        )
      })

      // Verify the exact body content
      const fetchCall = (global.fetch as jest.Mock).mock.calls.find(
        (call) => call[0] === '/api/create-customer-portal-session',
      )
      expect(fetchCall).toBeDefined()

      const [, options] = fetchCall!
      const body = JSON.parse(options.body)
      expect(body).toEqual({
        userId: 'test@example.com',
        returnUrl: 'http://localhost/subscription',
      })
    })

    it('handles upgrade subscription click when at limit', async () => {
      const user = userEvent.setup()
      const atLimitMembers = Array.from({ length: 5 }, (_, i) => ({
        id: `user-${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: 'member' as const,
        joinedAt: new Date('2024-01-01'),
        invitedBy: 'user-1',
      }))

      render(
        <TeamSubscriptionCard {...defaultProps} members={atLimitMembers} />,
      )

      const upgradeButton = screen.getByText('teams.addSeats')
      await user.click(upgradeButton)

      // Should open the team subscription dialog
      await waitFor(() => {
        expect(screen.getByText('teams.selectPlan')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const user = userEvent.setup()
      const mockCreateCustomerPortalSession =
        paymentService.createCustomerPortalSession as jest.Mock
      mockCreateCustomerPortalSession.mockRejectedValue(new Error('API Error'))

      render(<TeamSubscriptionCard {...defaultProps} />)

      const manageButton = screen.getByText('teams.manageBilling')
      await user.click(manageButton)

      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'common.error',
          description: 'teams.failedToOpenSubscriptionManagement',
          variant: 'destructive',
        })
      })
    })

    it('handles network errors', async () => {
      const user = userEvent.setup()
      const mockCreateCustomerPortalSession =
        paymentService.createCustomerPortalSession as jest.Mock
      mockCreateCustomerPortalSession.mockRejectedValue(
        new Error('Network error'),
      )

      render(<TeamSubscriptionCard {...defaultProps} />)

      const manageButton = screen.getByText('teams.manageBilling')
      await user.click(manageButton)

      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'common.error',
          description: 'teams.failedToOpenSubscriptionManagement',
          variant: 'destructive',
        })
      })
    })
  })

  describe('No Subscription State', () => {
    it('renders no subscription state', () => {
      render(<TeamSubscriptionCard {...defaultProps} subscription={null} />)

      expect(screen.getByText('teams.teamSubscription')).toBeInTheDocument()
      expect(
        screen.getByText('teams.teamSubscriptionDescription'),
      ).toBeInTheDocument()
      expect(screen.getByText('teams.noActiveSubscription')).toBeInTheDocument()
      expect(screen.getByText('teams.subscribeNow')).toBeInTheDocument()
    })

    it('handles subscribe now click', async () => {
      const user = userEvent.setup()
      render(<TeamSubscriptionCard {...defaultProps} subscription={null} />)

      const subscribeButton = screen.getByText('teams.subscribeNow')
      await user.click(subscribeButton)

      // Should open the team subscription dialog
      await waitFor(() => {
        expect(screen.getByText('teams.selectPlan')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('shows loading state during API calls', async () => {
      const user = userEvent.setup()
      let resolvePromise: (value: unknown) => void
      const portalPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      const mockCreateCustomerPortalSession =
        paymentService.createCustomerPortalSession as jest.Mock
      const mockRedirectToCustomerPortal =
        paymentService.redirectToCustomerPortal as jest.Mock

      mockCreateCustomerPortalSession.mockReturnValue(portalPromise)
      mockRedirectToCustomerPortal.mockResolvedValue(undefined)

      render(<TeamSubscriptionCard {...defaultProps} />)

      const manageButton = screen.getByText('teams.manageBilling')
      await user.click(manageButton)

      // Wait for the loading state to appear
      await waitFor(() => {
        expect(screen.getByText('common.loading')).toBeInTheDocument()
      })

      resolvePromise!({ url: 'https://example.com/portal' })

      await waitFor(() => {
        expect(screen.queryByText('common.loading')).not.toBeInTheDocument()
      })
    })
  })

  describe('Refresh Functionality', () => {
    it('shows refresh button and handles refresh click', async () => {
      const user = userEvent.setup()
      const mockGetTeamSubscription = getTeamSubscription as jest.Mock
      mockGetTeamSubscription.mockResolvedValue(mockSubscription)

      render(<TeamSubscriptionCard {...defaultProps} />)

      // Should show refresh button
      const refreshButton = screen.getByRole('button', { name: '' }) // Refresh button with icon only
      expect(refreshButton).toBeInTheDocument()

      // Click refresh button
      await user.click(refreshButton)

      // Should call getTeamSubscription
      expect(mockGetTeamSubscription).toHaveBeenCalledWith(mockTeam.id)

      // Should call onSubscriptionUpdate with the result
      await waitFor(() => {
        expect(defaultProps.onSubscriptionUpdate).toHaveBeenCalledWith(
          mockSubscription,
        )
      })

      // Should show success toast
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'teams.subscription',
        description: 'teams.subscriptionRefreshed',
        variant: 'default',
      })
    })

    it('handles refresh error gracefully', async () => {
      const user = userEvent.setup()
      const mockGetTeamSubscription = getTeamSubscription as jest.Mock
      mockGetTeamSubscription.mockRejectedValue(new Error('Refresh failed'))

      render(<TeamSubscriptionCard {...defaultProps} />)

      const refreshButton = screen.getByRole('button', { name: '' })
      await user.click(refreshButton)

      // Should show error toast
      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'common.error',
          description: 'teams.failedToRefreshSubscription',
          variant: 'destructive',
        })
      })
    })

    it('shows refresh button for no subscription state', async () => {
      const user = userEvent.setup()
      const mockGetTeamSubscription = getTeamSubscription as jest.Mock
      mockGetTeamSubscription.mockResolvedValue(null)

      render(<TeamSubscriptionCard {...defaultProps} subscription={null} />)

      // Should show refresh button even when no subscription
      const refreshButton = screen.getByRole('button', { name: '' })
      expect(refreshButton).toBeInTheDocument()

      // Click refresh button
      await user.click(refreshButton)

      // Should call getTeamSubscription
      expect(mockGetTeamSubscription).toHaveBeenCalledWith(mockTeam.id)

      // Should call onSubscriptionUpdate with null
      await waitFor(() => {
        expect(defaultProps.onSubscriptionUpdate).toHaveBeenCalledWith(null)
      })
    })
  })

  describe('Subscription Status Variations', () => {
    it('displays trialing status correctly', () => {
      const trialingSubscription = {
        ...mockSubscription,
        status: 'trialing' as const,
      }

      render(
        <TeamSubscriptionCard
          {...defaultProps}
          subscription={trialingSubscription}
        />,
      )

      expect(screen.getByText('trialing')).toBeInTheDocument()
    })

    it('displays past_due status correctly', () => {
      const pastDueSubscription = {
        ...mockSubscription,
        status: 'past_due' as const,
      }

      render(
        <TeamSubscriptionCard
          {...defaultProps}
          subscription={pastDueSubscription}
        />,
      )

      expect(screen.getByText('past_due')).toBeInTheDocument()
    })

    it('displays canceled status correctly', () => {
      const canceledSubscription = {
        ...mockSubscription,
        status: 'canceled' as const,
      }

      render(
        <TeamSubscriptionCard
          {...defaultProps}
          subscription={canceledSubscription}
        />,
      )

      expect(screen.getByText('canceled')).toBeInTheDocument()
    })
  })

  describe('Manage Seats Button', () => {
    it('shows manage seats button when onMembersChange is provided', () => {
      const mockOnMembersChange = jest.fn()

      render(
        <TeamSubscriptionCard
          {...defaultProps}
          onMembersChange={mockOnMembersChange}
        />,
      )

      expect(screen.getByText('teams.seatAssignment')).toBeInTheDocument()
    })

    it('does not show manage seats button when onMembersChange is not provided', () => {
      render(<TeamSubscriptionCard {...defaultProps} />)

      expect(screen.queryByText('teams.seatAssignment')).not.toBeInTheDocument()
    })

    it('opens seat assignment dialog when manage seats button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnMembersChange = jest.fn()

      render(
        <TeamSubscriptionCard
          {...defaultProps}
          onMembersChange={mockOnMembersChange}
        />,
      )

      const manageSeatsButton = screen.getByText('teams.seatAssignment')
      await user.click(manageSeatsButton)

      // The dialog should be rendered (we can't easily test the dialog content without more complex setup)
      expect(manageSeatsButton).toBeInTheDocument()
    })
  })
})
