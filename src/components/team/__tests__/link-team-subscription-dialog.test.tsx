import React from 'react'

import {
  defaultMockSubscriptionContext,
  render,
  screen,
  waitFor,
} from '@jest-setup'
import userEvent from '@testing-library/user-event'

import type { DocumentReference } from 'firebase/firestore'
import { doc, setDoc } from 'firebase/firestore'

import type { Subscription } from '@/lib/types'
// Get mocked functions after mocks are set up
import { subscriptionService } from '@/services/subscription-service'
import { createMockAuthContext, createMockUser } from '@/test-utils/auth-mocks'

import { LinkTeamSubscriptionDialog } from '../link-team-subscription-dialog'

const mockUsePricingPlans = jest.fn()
jest.mock('@/hooks/use-pricing-plans', () => ({
  usePricingPlans: (opts: { enabled?: boolean }) => mockUsePricingPlans(opts),
}))

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000 })),
}))

// Mock services
jest.mock('@/services/subscription-service', () => ({
  subscriptionService: {
    getUserSubscription: jest.fn(),
  },
}))

// Mock toast
const mockToast = {
  toast: jest.fn(),
}

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => mockToast,
}))

// Mock Firebase db
jest.mock('@/lib/firebase', () => ({
  db: {},
}))

const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>
const mockDoc = doc as jest.MockedFunction<typeof doc>

const mockAuthContext = createMockAuthContext()

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

const mockGetUserSubscription =
  subscriptionService.getUserSubscription as jest.MockedFunction<
    typeof subscriptionService.getUserSubscription
  >

const defaultProps = {
  open: true,
  onOpenChange: jest.fn(),
  teamId: 'team-123',
  onLinked: jest.fn(),
}

const mockTeamPlan = {
  id: 'team-plan-1',
  name: 'Team Plan',
  price: 29,
  currency: 'USD',
  interval: 'month' as const,
  features: ['Feature 1', 'Feature 2'],
  stripePriceId: 'price_team_123',
  maxUsers: 10,
}

const mockTeamSubscription: Subscription = {
  stripeSubscriptionId: 'sub_team_123',
  stripeCustomerId: 'cus_123',
  status: 'active',
  currentPeriodStart: new Date('2024-01-01'),
  cancelAtPeriodEnd: false,
  priceId: 'price_team_123',
  quantity: 5,
  updatedAt: new Date(),
  planName: 'Team Plan',
  planDescription: 'Team plan description',
}

describe('LinkTeamSubscriptionDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthContext.user = createMockUser({
      uid: 'user-123',
      email: 'test@example.com',
    })
    defaultMockSubscriptionContext.subscription = null
    defaultMockSubscriptionContext.loading = false
    defaultMockSubscriptionContext.error = null
    mockUsePricingPlans.mockReturnValue({
      data: [mockTeamPlan],
      isLoading: false,
      isError: false,
      error: null,
    })
    mockDoc.mockReturnValue({} as DocumentReference)
    mockSetDoc.mockResolvedValue(undefined)
  })

  it('renders dialog and shows loading state initially', () => {
    defaultMockSubscriptionContext.loading = true

    render(<LinkTeamSubscriptionDialog {...defaultProps} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByText('teams.linkExistingSubscription'),
    ).toBeInTheDocument()
    expect(screen.getAllByTestId('skeleton')).toHaveLength(3)
  })

  it('shows message when no linkable subscriptions', async () => {
    mockGetUserSubscription.mockResolvedValue({
      subscription: null,
      ownerId: 'user-123',
    })
    defaultMockSubscriptionContext.subscription = null
    defaultMockSubscriptionContext.loading = false

    render(<LinkTeamSubscriptionDialog {...defaultProps} />)

    await waitFor(() => {
      expect(
        screen.getByText('teams.noLinkableSubscriptions'),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /teams.linkSubscription/i }),
      ).toBeDisabled()
    })
  })

  it('displays linkable subscription and allows linking', async () => {
    mockGetUserSubscription.mockResolvedValue({
      subscription: mockTeamSubscription,
      ownerId: 'user-123',
    })
    defaultMockSubscriptionContext.subscription = mockTeamSubscription
    defaultMockSubscriptionContext.loading = false

    const user = userEvent.setup()
    render(<LinkTeamSubscriptionDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Team Plan')).toBeInTheDocument()
      expect(screen.getByText('Team plan description')).toBeInTheDocument()
      expect(screen.getByText(/teams.seatUsage/)).toBeInTheDocument()
    })

    const linkButton = screen.getByRole('button', {
      name: /teams.linkSubscription/i,
    })
    expect(linkButton).not.toBeDisabled()

    await user.click(linkButton)

    await waitFor(() => {
      expect(mockSetDoc).toHaveBeenCalled()
      expect(defaultProps.onLinked).toHaveBeenCalled()
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('shows past due warning for past_due subscriptions', async () => {
    const pastDueSubscription: Subscription = {
      ...mockTeamSubscription,
      status: 'past_due',
    }

    mockGetUserSubscription.mockResolvedValue({
      subscription: pastDueSubscription,
      ownerId: 'user-123',
    })
    defaultMockSubscriptionContext.subscription = pastDueSubscription
    defaultMockSubscriptionContext.loading = false

    render(<LinkTeamSubscriptionDialog {...defaultProps} />)

    await waitFor(() => {
      expect(
        screen.getByText('teams.subscriptionPastDueWarning'),
      ).toBeInTheDocument()
    })
  })

  it('handles errors gracefully', async () => {
    const user = userEvent.setup()
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    defaultMockSubscriptionContext.subscription = mockTeamSubscription
    defaultMockSubscriptionContext.loading = false
    mockGetUserSubscription.mockRejectedValue(
      new Error('Failed to load subscription'),
    )

    render(<LinkTeamSubscriptionDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Team Plan')).toBeInTheDocument()
    })

    const linkButton = screen.getByRole('button', {
      name: /teams.linkSubscription/i,
    })
    await user.click(linkButton)

    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'common.error',
          variant: 'destructive',
        }),
      )
    })

    consoleErrorSpy.mockRestore()
  })

  it('allows canceling dialog', async () => {
    const user = userEvent.setup()

    mockGetUserSubscription.mockResolvedValue({
      subscription: mockTeamSubscription,
      ownerId: 'user-123',
    })
    defaultMockSubscriptionContext.subscription = mockTeamSubscription
    defaultMockSubscriptionContext.loading = false

    render(<LinkTeamSubscriptionDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
    })

    const cancelButton = screen.getByRole('button', {
      name: /common.cancel/i,
    })
    await user.click(cancelButton)

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })
})
