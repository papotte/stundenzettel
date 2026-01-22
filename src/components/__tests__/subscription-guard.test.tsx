import React from 'react'

import { render, screen, waitFor } from '@jest-setup'

import { useSubscriptionContext } from '@/context/subscription-context'
import { subscriptionService } from '@/services/subscription-service'
import { createMockAuthContext, createMockUser } from '@/test-utils/auth-mocks'

import SubscriptionGuard from '../subscription-guard'

// Mock the subscription context
jest.mock('@/context/subscription-context', () => ({
  useSubscriptionContext: jest.fn(),
}))

// Mock the subscription service (for isInTrial, etc.)
jest.mock('@/services/subscription-service', () => ({
  subscriptionService: {
    isInTrial: jest.fn(),
    getDaysRemainingInTrial: jest.fn(),
    isTrialExpiringSoon: jest.fn(),
    clearCache: jest.fn(),
  },
}))

// Mock window.location
const mockLocation = {
  href: '',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

const mockAuthContext = createMockAuthContext()

// Mock useAuth hook
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(component)
}

describe('SubscriptionGuard', () => {
  const mockUseSubscriptionContext =
    useSubscriptionContext as jest.MockedFunction<typeof useSubscriptionContext>
  const mockIsInTrial = subscriptionService.isInTrial as jest.Mock
  const mockGetDaysRemainingInTrial =
    subscriptionService.getDaysRemainingInTrial as jest.Mock
  const mockIsTrialExpiringSoon =
    subscriptionService.isTrialExpiringSoon as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthContext.user = null
    mockAuthContext.loading = false
    mockLocation.href = ''

    // Default mock implementations
    mockIsInTrial.mockReturnValue(false)
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
  })

  it('shows loading state while checking subscription', () => {
    mockAuthContext.user = createMockUser({
      uid: 'user123',
      email: 'test@example.com',
    })
    mockUseSubscriptionContext.mockReturnValue({
      hasValidSubscription: null,
      loading: true,
      error: null,
      subscription: null,
      ownerId: null,
      invalidateSubscription: jest.fn(),
    })

    renderWithProviders(
      <SubscriptionGuard>
        <div>Protected Content</div>
      </SubscriptionGuard>,
    )

    expect(screen.getByText('subscription.checking')).toBeInTheDocument()
    expect(screen.getByTestId('loading-icon')).toBeInTheDocument()
  })

  it('shows login required message for unauthenticated users', async () => {
    mockAuthContext.user = null
    mockUseSubscriptionContext.mockReturnValue({
      hasValidSubscription: false,
      loading: false,
      error: null,
      subscription: null,
      ownerId: null,
      invalidateSubscription: jest.fn(),
    })

    renderWithProviders(
      <SubscriptionGuard>
        <div>Protected Content</div>
      </SubscriptionGuard>,
    )

    await waitFor(() => {
      expect(
        screen.getByText('subscription.loginRequiredTitle'),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'subscription.loginButton' }),
      ).toBeInTheDocument()
    })

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('shows subscription required message for authenticated users without subscription', async () => {
    mockAuthContext.user = createMockUser({
      uid: 'user123',
      email: 'test@example.com',
    })
    mockUseSubscriptionContext.mockReturnValue({
      hasValidSubscription: false,
      loading: false,
      error: null,
      subscription: null,
      ownerId: null,
      invalidateSubscription: jest.fn(),
    })

    renderWithProviders(
      <SubscriptionGuard>
        <div>Protected Content</div>
      </SubscriptionGuard>,
    )

    await waitFor(() => {
      expect(screen.getByText('subscription.requiredTitle')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'subscription.choosePlanButton' }),
      ).toBeInTheDocument()
    })

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children for users with valid subscription', async () => {
    mockAuthContext.user = createMockUser({
      uid: 'user123',
      email: 'test@example.com',
    })
    const mockSubscription = {
      stripeSubscriptionId: 'sub_123',
      stripeCustomerId: 'cus_123',
      status: 'active' as const,
      currentPeriodStart: new Date(),
      cancelAtPeriodEnd: false,
      priceId: 'price_123',
      updatedAt: new Date(),
    }

    mockUseSubscriptionContext.mockReturnValue({
      hasValidSubscription: true,
      loading: false,
      error: null,
      subscription: mockSubscription,
      ownerId: null,
      invalidateSubscription: jest.fn(),
    })

    renderWithProviders(
      <SubscriptionGuard>
        <div>Protected Content</div>
      </SubscriptionGuard>,
    )

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('shows trial banner for trialing users when showTrialBanner is true', async () => {
    mockAuthContext.user = createMockUser({
      uid: 'user123',
      email: 'test@example.com',
    })
    const mockSubscription = {
      stripeSubscriptionId: 'sub_123',
      stripeCustomerId: 'cus_123',
      status: 'trialing' as const,
      currentPeriodStart: new Date(),
      cancelAtPeriodEnd: false,
      priceId: 'price_123',
      updatedAt: new Date(),
    }

    mockUseSubscriptionContext.mockReturnValue({
      hasValidSubscription: true,
      loading: false,
      error: null,
      subscription: mockSubscription,
      ownerId: null,
      invalidateSubscription: jest.fn(),
    })
    mockIsInTrial.mockReturnValue(true)
    mockGetDaysRemainingInTrial.mockReturnValue(5)
    mockIsTrialExpiringSoon.mockReturnValue(false)

    renderWithProviders(
      <SubscriptionGuard showTrialBanner={true}>
        <div>Protected Content</div>
      </SubscriptionGuard>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('trial-banner')).toBeInTheDocument()
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('does not show trial banner when showTrialBanner is false', async () => {
    mockAuthContext.user = createMockUser({
      uid: 'user123',
      email: 'test@example.com',
    })
    const mockSubscription = {
      stripeSubscriptionId: 'sub_123',
      stripeCustomerId: 'cus_123',
      status: 'trialing' as const,
      currentPeriodStart: new Date(),
      cancelAtPeriodEnd: false,
      priceId: 'price_123',
      updatedAt: new Date(),
    }

    mockUseSubscriptionContext.mockReturnValue({
      hasValidSubscription: true,
      loading: false,
      error: null,
      subscription: mockSubscription,
      ownerId: null,
      invalidateSubscription: jest.fn(),
    })
    mockIsInTrial.mockReturnValue(true)

    renderWithProviders(
      <SubscriptionGuard showTrialBanner={false}>
        <div>Protected Content</div>
      </SubscriptionGuard>,
    )

    await waitFor(() => {
      expect(screen.queryByTestId('trial-banner')).not.toBeInTheDocument()
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('renders custom fallback content when provided', async () => {
    mockAuthContext.user = createMockUser({
      uid: 'user123',
      email: 'test@example.com',
    })
    mockUseSubscriptionContext.mockReturnValue({
      hasValidSubscription: false,
      loading: false,
      error: null,
      subscription: null,
      ownerId: null,
      invalidateSubscription: jest.fn(),
    })

    const customFallback = <div>Custom Fallback Content</div>

    renderWithProviders(
      <SubscriptionGuard fallback={customFallback}>
        <div>Protected Content</div>
      </SubscriptionGuard>,
    )

    await waitFor(() => {
      expect(screen.getByText('Custom Fallback Content')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
      expect(
        screen.queryByText('subscription.requiredTitle'),
      ).not.toBeInTheDocument()
    })
  })
})
