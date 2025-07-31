import React from 'react'

import { render, screen, waitFor } from '@jest-setup'
import userEvent from '@testing-library/user-event'

import { useRouter } from 'next/navigation'

import { AuthProvider } from '@/context/auth-context'
import { __clearSubscriptionCacheForTests } from '@/hooks/use-subscription-status'
import type { Subscription } from '@/lib/types'
import { subscriptionService } from '@/services/subscription-service'
import { createMockAuthContext, createMockUser } from '@/test-utils/auth-mocks'

import SubscriptionPage from '../page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock services
jest.mock('@/services/subscription-service', () => ({
  subscriptionService: {
    getUserSubscription: jest.fn(),
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

const mockSubscriptionService = jest.mocked(subscriptionService)

// Use centralized auth mock
const mockAuthContext = createMockAuthContext()
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>)
}

describe('SubscriptionPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    __clearSubscriptionCacheForTests()
    // Reset auth context to authenticated state
    mockAuthContext.user = createMockUser()
    mockAuthContext.loading = false
  })

  it('redirects to login when user is not authenticated', async () => {
    mockAuthContext.user = null

    renderWithProviders(<SubscriptionPage />)

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/login?returnUrl=/subscription',
      )
    })
  })

  it('shows loading skeleton when auth is loading', () => {
    mockAuthContext.loading = true
    mockAuthContext.user = null

    renderWithProviders(<SubscriptionPage />)

    expect(screen.getAllByTestId('skeleton')).toHaveLength(2)
  })

  it('shows no subscription state when user has no subscription', async () => {
    mockSubscriptionService.getUserSubscription.mockResolvedValue(null)

    renderWithProviders(<SubscriptionPage />)

    await waitFor(
      () => {
        expect(
          screen.getByText('subscription.noSubscription'),
        ).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
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

    mockSubscriptionService.getUserSubscription.mockResolvedValue(
      mockSubscription,
    )

    renderWithProviders(<SubscriptionPage />)

    await waitFor(
      () => {
        expect(screen.getByText('subscription.currentPlan')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('handles upgrade button click', async () => {
    const user = userEvent.setup()
    mockSubscriptionService.getUserSubscription.mockResolvedValue(null)

    // Mock window.location
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    })

    renderWithProviders(<SubscriptionPage />)

    await waitFor(
      () => {
        expect(screen.getByText('subscription.upgrade')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

    await user.click(screen.getByText('subscription.upgrade'))

    expect(window.location.href).toBe('/pricing')

    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    })
  })

  it('calls subscription service with correct user ID', async () => {
    mockSubscriptionService.getUserSubscription.mockResolvedValue(null)

    renderWithProviders(<SubscriptionPage />)

    await waitFor(
      () => {
        expect(
          mockSubscriptionService.getUserSubscription,
        ).toHaveBeenCalledWith('test-user-id')
      },
      { timeout: 3000 },
    )
  })
})
