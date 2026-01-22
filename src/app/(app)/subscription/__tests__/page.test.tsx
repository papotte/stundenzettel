import React from 'react'

import { render, screen, waitFor } from '@jest-setup'
import userEvent from '@testing-library/user-event'

import { useRouter } from 'next/navigation'

import { useSubscriptionContext } from '@/context/subscription-context'
import type { Subscription } from '@/lib/types'
import { subscriptionService } from '@/services/subscription-service'
import { createMockAuthContext, createMockUser } from '@/test-utils/auth-mocks'

import SubscriptionPage from '../page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock subscription context
jest.mock('@/context/subscription-context', () => ({
  useSubscriptionContext: jest.fn(),
}))

// Mock subscription service (for isInTrial, etc.)
jest.mock('@/services/subscription-service', () => ({
  subscriptionService: {
    isInTrial: jest.fn(),
    getTrialEndDate: jest.fn(),
    getDaysRemainingInTrial: jest.fn(),
    isTrialExpiringSoon: jest.fn(),
    clearCache: jest.fn(),
  },
}))

jest.mock('@/services/payment-service', () => ({
  paymentService: {
    createCustomerPortalSession: jest.fn(),
    redirectToCustomerPortal: jest.fn(),
  },
}))

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

const mockRouter = {
  replace: jest.fn(),
}

const mockUseSubscriptionContext =
  useSubscriptionContext as jest.MockedFunction<typeof useSubscriptionContext>
const mockIsInTrial = subscriptionService.isInTrial as jest.Mock
const mockGetTrialEndDate = subscriptionService.getTrialEndDate as jest.Mock
const mockGetDaysRemainingInTrial =
  subscriptionService.getDaysRemainingInTrial as jest.Mock
const mockIsTrialExpiringSoon =
  subscriptionService.isTrialExpiringSoon as jest.Mock

// Use centralized auth mock
const mockAuthContext = createMockAuthContext()
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(component)
}

describe('SubscriptionPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)

    // Default mock implementations
    mockIsInTrial.mockReturnValue(false)
    mockGetTrialEndDate.mockReturnValue(null)
    mockGetDaysRemainingInTrial.mockReturnValue(null)
    mockIsTrialExpiringSoon.mockReturnValue(false)

    // Default context mock - no subscription, not loading
    mockUseSubscriptionContext.mockReturnValue({
      hasValidSubscription: false,
      loading: false,
      error: null,
      subscription: null,
      ownerId: null,
      invalidateSubscription: jest.fn(),
    })

    // Reset auth context to authenticated state
    mockAuthContext.user = createMockUser()
    mockAuthContext.loading = false
  })

  it('redirects to login when user is not authenticated', async () => {
    mockAuthContext.user = null
    mockAuthContext.loading = false

    renderWithProviders(<SubscriptionPage />)

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/login?returnUrl=/subscription',
      )
    })
  })

  it('shows loading skeleton when loading', () => {
    mockAuthContext.loading = true

    renderWithProviders(<SubscriptionPage />)

    expect(screen.getAllByTestId('skeleton')).toHaveLength(2)
  })

  it('shows no subscription state when user has no subscription', async () => {
    mockUseSubscriptionContext.mockReturnValue({
      hasValidSubscription: false,
      loading: false,
      error: null,
      subscription: null,
      ownerId: null,
      invalidateSubscription: jest.fn(),
    })

    renderWithProviders(<SubscriptionPage />)

    await waitFor(() => {
      expect(
        screen.getByText('subscription.noSubscription'),
      ).toBeInTheDocument()
    })
  })

  it('shows active subscription details', async () => {
    const mockSubscription: Subscription = {
      stripeSubscriptionId: 'sub_stripe_123',
      stripeCustomerId: 'cus_123',
      status: 'active',
      currentPeriodStart: new Date('2024-01-01'),
      cancelAt: new Date('2024-12-31'),
      cancelAtPeriodEnd: false,
      priceId: 'price_123',
      updatedAt: new Date(),
    }

    mockUseSubscriptionContext.mockReturnValue({
      hasValidSubscription: true,
      loading: false,
      error: null,
      subscription: mockSubscription,
      ownerId: 'test-user-id',
      invalidateSubscription: jest.fn(),
    })

    renderWithProviders(<SubscriptionPage />)

    await waitFor(() => {
      expect(screen.getByText('subscription.currentPlan')).toBeInTheDocument()
    })
  })

  it('handles upgrade button click', async () => {
    const user = userEvent.setup()
    mockUseSubscriptionContext.mockReturnValue({
      hasValidSubscription: false,
      loading: false,
      error: null,
      subscription: null,
      ownerId: null,
      invalidateSubscription: jest.fn(),
    })

    // Mock window.location
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    })

    renderWithProviders(<SubscriptionPage />)

    await waitFor(() => {
      expect(screen.getByText('subscription.upgrade')).toBeInTheDocument()
    })

    await user.click(screen.getByText('subscription.upgrade'))

    expect(window.location.href).toBe('/pricing')

    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    })
  })
})
