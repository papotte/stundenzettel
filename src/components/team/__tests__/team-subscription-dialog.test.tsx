import React from 'react'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { Team } from '@/lib/types'
import { getPricingPlans } from '@/services/payment-service'

import { TeamSubscriptionDialog } from '../team-subscription-dialog'

// Mock the auth context
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: {
      uid: 'user-1',
      email: 'test@example.com',
    },
  }),
}))

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

// Mock fetch
global.fetch = jest.fn()

// Mock the payment service
jest.mock('@/services/payment-service', () => ({
  getPricingPlans: jest.fn(),
}))

const mockTeam: Team = {
  id: 'team-1',
  name: 'Test Team',
  ownerId: 'user-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockPricingPlans = [
  {
    id: 'team-monthly',
    name: 'Team Monthly',
    price: 10,
    currency: 'EUR',
    interval: 'month',
    features: ['Team collaboration', 'Shared projects', 'Admin dashboard'],
    stripePriceId: 'price_team_monthly',
    maxUsers: 50,
    trialEnabled: true,
  },
  {
    id: 'team-yearly',
    name: 'Team Yearly',
    price: 100,
    currency: 'EUR',
    interval: 'year',
    features: ['Team collaboration', 'Shared projects', 'Admin dashboard'],
    stripePriceId: 'price_team_yearly',
    maxUsers: 50,
    trialEnabled: true,
  },
]

const defaultProps = {
  open: true,
  onOpenChange: jest.fn(),
  team: mockTeam,
  currentMembersCount: 3,
  onSubscriptionCreated: jest.fn(),
}

describe('TeamSubscriptionDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/test' }),
    })
    ;(getPricingPlans as jest.Mock).mockResolvedValue(mockPricingPlans)
  })

  it('renders dialog with loading state initially', () => {
    render(<TeamSubscriptionDialog {...defaultProps} />)

    expect(screen.getByText('teams.createTeamSubscription')).toBeInTheDocument()
    expect(screen.getByText('teams.loadingPricingPlans')).toBeInTheDocument()
  })

  it('loads and displays pricing plans', async () => {
    render(<TeamSubscriptionDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('teams.selectPlan')).toBeInTheDocument()
    })

    // Initially shows monthly plans only
    expect(screen.getByText('Team Monthly')).toBeInTheDocument()
    expect(screen.queryByText('Team Yearly')).not.toBeInTheDocument()
  })

  it('allows switching between monthly and yearly billing', async () => {
    render(<TeamSubscriptionDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('teams.selectPlan')).toBeInTheDocument()
    })

    // Initially shows monthly plans
    expect(screen.getByText('Team Monthly')).toBeInTheDocument()
    expect(screen.queryByText('Team Yearly')).not.toBeInTheDocument()

    // Toggle to yearly
    const yearlyToggle = screen.getByRole('switch')
    fireEvent.click(yearlyToggle)

    // Should now show yearly plans
    expect(screen.getByText('Team Yearly')).toBeInTheDocument()
    expect(screen.queryByText('Team Monthly')).not.toBeInTheDocument()
  })

  it('displays current seat count and allows adjustment', async () => {
    render(<TeamSubscriptionDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('teams.numberOfSeats')).toBeInTheDocument()
    })

    const seatsInput = screen.getByDisplayValue('3')
    expect(seatsInput).toBeInTheDocument()

    // Test increment
    const plusButton = screen.getByRole('button', { name: /increase seats/i })
    fireEvent.click(plusButton)
    expect(screen.getByDisplayValue('4')).toBeInTheDocument()

    // Test decrement
    const minusButton = screen.getByRole('button', { name: /decrease seats/i })
    fireEvent.click(minusButton)
    expect(screen.getByDisplayValue('3')).toBeInTheDocument()
  })

  it('enforces minimum seat count based on current members', async () => {
    render(<TeamSubscriptionDialog {...defaultProps} currentMembersCount={5} />)

    await waitFor(() => {
      expect(screen.getByText('teams.numberOfSeats')).toBeInTheDocument()
    })

    const minusButton = screen.getByRole('button', { name: /decrease seats/i })
    expect(minusButton).toBeDisabled()

    const seatsInput = screen.getByDisplayValue('5')
    expect(seatsInput).toBeInTheDocument()
  })

  it('enforces maximum seat count from plan', async () => {
    render(<TeamSubscriptionDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('teams.numberOfSeats')).toBeInTheDocument()
    })

    // Set seats to maximum
    const seatsInput = screen.getByDisplayValue('3')
    fireEvent.change(seatsInput, { target: { value: '50' } })

    const plusButton = screen.getByRole('button', { name: /increase seats/i })
    expect(plusButton).toBeDisabled()
  })

  it('creates checkout session when subscribe button is clicked', async () => {
    const user = userEvent.setup()
    render(<TeamSubscriptionDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('teams.subscribeNow')).toBeInTheDocument()
    })

    // Wait for plan to be selected (it should be auto-selected)
    await waitFor(() => {
      expect(screen.getByText('teams.subscribeNow')).not.toBeDisabled()
    })

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
            userEmail: 'test@example.com',
            teamId: 'team-1',
            priceId: 'price_team_monthly',
            quantity: 3,
            successUrl: 'http://localhost/team?success=true',
            cancelUrl: 'http://localhost/team?canceled=true',
            trialEnabled: true,
            requirePaymentMethod: true,
          }),
        }),
      )
    })
  })

  it('closes dialog when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<TeamSubscriptionDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('common.cancel')).toBeInTheDocument()
    })

    const cancelButton = screen.getByText('common.cancel')
    await user.click(cancelButton)

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows error message when no team plans are available', async () => {
    ;(getPricingPlans as jest.Mock).mockResolvedValue([])

    render(<TeamSubscriptionDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('teams.noTeamPlansAvailable')).toBeInTheDocument()
    })
  })
})
