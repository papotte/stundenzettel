import React from 'react'

import { fireEvent, render, screen, waitFor } from '@jest-setup'
import userEvent from '@testing-library/user-event'

import type { Team } from '@/lib/types'

import { TeamSubscriptionDialog } from '../team-subscription-dialog'

const mockUsePricingPlans = jest.fn()
jest.mock('@/hooks/use-pricing-plans', () => ({
  usePricingPlans: (opts: { enabled?: boolean }) => mockUsePricingPlans(opts),
}))

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

const mockCreateTeamCheckoutSession = jest.fn()
jest.mock('@/services/payment-service', () => ({
  paymentService: {
    createTeamCheckoutSession: (...args: unknown[]) =>
      mockCreateTeamCheckoutSession(...args),
  },
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
    mockCreateTeamCheckoutSession.mockResolvedValue({
      sessionId: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    })
    mockUsePricingPlans.mockReturnValue({
      data: mockPricingPlans,
      isLoading: false,
      isError: false,
      error: null,
    })
  })

  it('renders dialog with loading state initially', () => {
    mockUsePricingPlans.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      error: null,
    })
    render(<TeamSubscriptionDialog {...defaultProps} />)

    expect(screen.getByText('teams.createTeamSubscription')).toBeInTheDocument()
    expect(screen.getByText('teams.loadingPricingPlans')).toBeInTheDocument()
  })

  it('loads and displays pricing plans', async () => {
    render(<TeamSubscriptionDialog {...defaultProps} />)

    await waitFor(
      () => {
        expect(screen.getByText('teams.selectPlan')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

    expect(mockUsePricingPlans).toHaveBeenCalledWith({ enabled: true })

    expect(screen.getByText('Team Monthly')).toBeInTheDocument()
    expect(screen.queryByText('Team Yearly')).not.toBeInTheDocument()
  })

  it('allows switching between monthly and yearly billing', async () => {
    render(<TeamSubscriptionDialog {...defaultProps} />)

    // Wait for the loading to complete and plans to be displayed
    await waitFor(
      () => {
        expect(screen.getByText('teams.selectPlan')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

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

    // Wait for the loading to complete and plans to be displayed
    await waitFor(
      () => {
        expect(screen.getByText('teams.numberOfSeats')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

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

    // Wait for the loading to complete and plans to be displayed
    await waitFor(
      () => {
        expect(screen.getByText('teams.numberOfSeats')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

    const minusButton = screen.getByRole('button', { name: /decrease seats/i })
    expect(minusButton).toBeDisabled()

    const seatsInput = screen.getByDisplayValue('5')
    expect(seatsInput).toBeInTheDocument()
  })

  it('enforces maximum seat count from plan', async () => {
    render(<TeamSubscriptionDialog {...defaultProps} />)

    // Wait for the loading to complete and plans to be displayed
    await waitFor(
      () => {
        expect(screen.getByText('teams.numberOfSeats')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

    // Set seats to maximum
    const seatsInput = screen.getByDisplayValue('3')
    fireEvent.change(seatsInput, { target: { value: '50' } })

    const plusButton = screen.getByRole('button', { name: /increase seats/i })
    expect(plusButton).toBeDisabled()
  })

  it('creates checkout session when subscribe button is clicked', async () => {
    const user = userEvent.setup()
    mockCreateTeamCheckoutSession.mockResolvedValue({
      sessionId: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    })
    render(<TeamSubscriptionDialog {...defaultProps} />)

    await waitFor(
      () => {
        expect(screen.getByText('teams.subscribeNow')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

    await waitFor(() => {
      expect(screen.getByText('teams.subscribeNow')).not.toBeDisabled()
    })

    const subscribeButton = screen.getByText('teams.subscribeNow')
    await user.click(subscribeButton)

    await waitFor(() => {
      expect(mockCreateTeamCheckoutSession).toHaveBeenCalledTimes(1)
    })

    expect(mockCreateTeamCheckoutSession).toHaveBeenCalledWith(
      'user-1',
      'team-1',
      'price_team_monthly',
      3,
      expect.stringMatching(/\/team\?success=true$/),
      expect.stringMatching(/\/team\?canceled=true$/),
      true,
      true,
    )
  })

  it('closes dialog when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<TeamSubscriptionDialog {...defaultProps} />)

    // Wait for the loading to complete and plans to be displayed
    await waitFor(
      () => {
        expect(screen.getByText('common.cancel')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

    const cancelButton = screen.getByText('common.cancel')
    await user.click(cancelButton)

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows error message when no team plans are available', async () => {
    mockUsePricingPlans.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    })

    render(<TeamSubscriptionDialog {...defaultProps} />)

    await waitFor(
      () => {
        expect(
          screen.getByText('teams.noTeamPlansAvailable'),
        ).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })
})
