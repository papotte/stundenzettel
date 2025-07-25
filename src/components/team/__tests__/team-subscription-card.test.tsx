import React from 'react'

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useToast } from '@/hooks/use-toast'
import type { Subscription, Team, TeamMember } from '@/lib/types'

import { TeamSubscriptionCard } from '../team-subscription-card'

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
              customerId: 'cus_123',
              returnUrl: 'http://localhost/',
            }),
          }),
        )
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

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/create-team-checkout-session',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: 'user-1',
              teamId: 'team-1',
              priceId: 'price_team_monthly',
              quantity: 5,
              successUrl: 'http://localhost/team?success=true',
              cancelUrl: 'http://localhost/team?canceled=true',
            }),
          }),
        )
      })
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      })

      render(<TeamSubscriptionCard {...defaultProps} />)

      const manageButton = screen.getByText('teams.manageBilling')
      await user.click(manageButton)

      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'teams.error',
          description: 'teams.failedToOpenSubscriptionManagement',
          variant: 'destructive',
        })
      })
    })

    it('handles network errors', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<TeamSubscriptionCard {...defaultProps} />)

      const manageButton = screen.getByText('teams.manageBilling')
      await user.click(manageButton)

      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'teams.error',
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

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/create-team-checkout-session',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: 'user-1',
              teamId: 'team-1',
              priceId: 'price_team_monthly',
              quantity: 2,
              successUrl: 'http://localhost/team?success=true',
              cancelUrl: 'http://localhost/team?canceled=true',
            }),
          }),
        )
      })
    })
  })

  describe('Loading States', () => {
    it('shows loading state during API calls', async () => {
      const user = userEvent.setup()
      let resolveFetch: (value: any) => void
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve
      })
      ;(global.fetch as jest.Mock).mockReturnValue(fetchPromise)

      render(<TeamSubscriptionCard {...defaultProps} />)

      const manageButton = screen.getByText('teams.manageBilling')
      await user.click(manageButton)

      expect(screen.getByText('teams.loading')).toBeInTheDocument()

      resolveFetch!({
        ok: true,
        json: () => Promise.resolve({ url: 'https://example.com/portal' }),
      })

      await waitFor(() => {
        expect(screen.queryByText('teams.loading')).not.toBeInTheDocument()
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
})
