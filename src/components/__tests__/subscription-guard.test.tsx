import React from 'react'

import { render, screen, waitFor } from '@testing-library/react'

import { AuthProvider } from '@/context/auth-context'
import { subscriptionService } from '@/services/subscription-service'
import { createMockAuthContext } from '@/test-utils/auth-mocks'

import SubscriptionGuard from '../subscription-guard'

// Mock the subscription service
jest.mock('@/services/subscription-service', () => ({
  subscriptionService: {
    getUserSubscription: jest.fn(),
  },
}))

const mockGetUserSubscription =
  subscriptionService.getUserSubscription as jest.MockedFunction<
    typeof subscriptionService.getUserSubscription
  >

// Mock window.location
const mockLocation = {
  href: '',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

// Use centralized auth mock
const mockAuthContext = createMockAuthContext()

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>)
}

describe('SubscriptionGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocation.href = ''
  })

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockAuthContext.user = null
      mockAuthContext.loading = false
    })

    it('shows login required message', async () => {
      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(
          screen.getByText('subscription.loginRequiredTitle'),
        ).toBeInTheDocument()
      })
      expect(
        screen.getByText('subscription.loginRequiredDescription'),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'subscription.loginButton' }),
      ).toBeInTheDocument()
    })

    it('redirects to login when login button is clicked', async () => {
      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(
          screen.getByText('subscription.loginRequiredTitle'),
        ).toBeInTheDocument()
      })

      const loginButton = screen.getByRole('button', {
        name: 'subscription.loginButton',
      })
      loginButton.click()

      expect(mockLocation.href).toBe('/login')
    })
  })

  describe('when user is authenticated but has no subscription', () => {
    beforeEach(() => {
      mockAuthContext.user = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
      }
      mockAuthContext.loading = false
      mockGetUserSubscription.mockResolvedValue(null)
    })

    it('shows subscription required message', async () => {
      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(
          screen.getByText('subscription.requiredTitle'),
        ).toBeInTheDocument()
      })
      expect(
        screen.getByText('subscription.requiredDescription'),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'subscription.choosePlanButton' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', {
          name: 'subscription.manageSubscriptionButton',
        }),
      ).toBeInTheDocument()
    })

    it('redirects to pricing when choose plan button is clicked', async () => {
      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(
          screen.getByText('subscription.requiredTitle'),
        ).toBeInTheDocument()
      })

      const choosePlanButton = screen.getByRole('button', {
        name: 'subscription.choosePlanButton',
      })
      choosePlanButton.click()

      expect(mockLocation.href).toBe('/pricing')
    })

    it('redirects to subscription when manage subscription button is clicked', async () => {
      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(
          screen.getByText('subscription.requiredTitle'),
        ).toBeInTheDocument()
      })

      const manageButton = screen.getByRole('button', {
        name: 'subscription.manageSubscriptionButton',
      })
      manageButton.click()

      expect(mockLocation.href).toBe('/subscription')
    })
  })

  describe('when user is authenticated and has inactive subscription', () => {
    beforeEach(() => {
      mockAuthContext.user = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
      }
      mockAuthContext.loading = false
      mockGetUserSubscription.mockResolvedValue({
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'canceled',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        updatedAt: new Date(),
      })
    })

    it('shows subscription required message', async () => {
      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(
          screen.getByText('subscription.requiredTitle'),
        ).toBeInTheDocument()
      })
      expect(
        screen.getByText('subscription.requiredDescription'),
      ).toBeInTheDocument()
    })
  })

  describe('when user is authenticated and has active subscription', () => {
    beforeEach(() => {
      mockAuthContext.user = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
      }
      mockAuthContext.loading = false
      mockGetUserSubscription.mockResolvedValue({
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active',
        currentPeriodStart: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        updatedAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
    })

    it('renders children when subscription is active', async () => {
      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(screen.getByText('Protected content')).toBeInTheDocument()
      })
    })

    it('does not show subscription prompts', async () => {
      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(screen.getByText('Protected content')).toBeInTheDocument()
      })

      expect(
        screen.queryByText('subscription.requiredTitle'),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText('subscription.loginRequiredTitle'),
      ).not.toBeInTheDocument()
    })
  })

  describe('when subscription service throws an error', () => {
    beforeEach(() => {
      mockAuthContext.user = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
      }
      mockAuthContext.loading = false
      mockGetUserSubscription.mockRejectedValue(new Error('Service error'))
    })

    it('shows subscription required message', async () => {
      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(
          screen.getByText('subscription.requiredTitle'),
        ).toBeInTheDocument()
      })
      expect(
        screen.getByText('subscription.requiredDescription'),
      ).toBeInTheDocument()
    })
  })

  describe('with custom fallback', () => {
    beforeEach(() => {
      mockAuthContext.user = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
      }
      mockAuthContext.loading = false
      mockGetUserSubscription.mockResolvedValue(null)
    })

    it('renders custom fallback instead of default subscription prompt', async () => {
      const customFallback = <div>Custom subscription message</div>

      renderWithProviders(
        <SubscriptionGuard fallback={customFallback}>
          <div>Protected content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(
          screen.getByText('Custom subscription message'),
        ).toBeInTheDocument()
      })

      expect(
        screen.queryByText('subscription.requiredTitle'),
      ).not.toBeInTheDocument()
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    })
  })
})
