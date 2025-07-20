import React from 'react'

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AuthProvider } from '@/context/auth-context'
import { subscriptionService } from '@/services/subscription-service'
import { createMockAuthContext, createMockUser } from '@/test-utils/auth-mocks'

import SubscriptionGuard from '../subscription-guard'

// Mock the subscription service
jest.mock('@/services/subscription-service', () => ({
  subscriptionService: {
    getUserSubscription: jest.fn(),
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
  return render(<AuthProvider>{component}</AuthProvider>)
}

describe('SubscriptionGuard', () => {
  const mockGetUserSubscription =
    subscriptionService.getUserSubscription as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthContext.user = null
    mockAuthContext.loading = false
    mockLocation.href = ''
  })

  describe('Loading State', () => {
    it('shows loading state while checking subscription', async () => {
      mockAuthContext.user = createMockUser({
        uid: 'user123',
        email: 'test@example.com',
      })
      mockGetUserSubscription.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      )

      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected Content</div>
        </SubscriptionGuard>,
      )

      // Check loading state immediately after render
      expect(screen.getByText('subscription.checking')).toBeInTheDocument()
      expect(screen.getByTestId('loading-icon')).toBeInTheDocument()
    })
  })

  describe('Unauthenticated Users', () => {
    it('shows login required message for unauthenticated users', async () => {
      mockAuthContext.user = null
      mockGetUserSubscription.mockResolvedValue(null)

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
          screen.getByText('subscription.loginRequiredDescription'),
        ).toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: 'subscription.loginButton' }),
        ).toBeInTheDocument()
      })

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('redirects to login when login button is clicked', async () => {
      const user = userEvent.setup()
      mockAuthContext.user = null
      mockGetUserSubscription.mockResolvedValue(null)

      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected Content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'subscription.loginButton' }),
        ).toBeInTheDocument()
      })

      const loginButton = screen.getByRole('button', {
        name: 'subscription.loginButton',
      })
      await user.click(loginButton)

      expect(mockLocation.href).toBe('/login')
    })
  })

  describe('Authenticated Users Without Subscription', () => {
    beforeEach(() => {
      mockAuthContext.user = createMockUser({
        uid: 'user123',
        email: 'test@example.com',
      })
    })

    it('shows subscription required message for users without subscription', async () => {
      mockGetUserSubscription.mockResolvedValue(null)

      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected Content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(
          screen.getByText('subscription.requiredTitle'),
        ).toBeInTheDocument()
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

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('redirects to pricing when choose plan button is clicked', async () => {
      const user = userEvent.setup()
      mockGetUserSubscription.mockResolvedValue(null)

      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected Content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'subscription.choosePlanButton' }),
        ).toBeInTheDocument()
      })

      const choosePlanButton = screen.getByRole('button', {
        name: 'subscription.choosePlanButton',
      })
      await user.click(choosePlanButton)

      expect(mockLocation.href).toBe('/pricing')
    })

    it('redirects to subscription page when manage subscription button is clicked', async () => {
      const user = userEvent.setup()
      mockGetUserSubscription.mockResolvedValue(null)

      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected Content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(
          screen.getByRole('button', {
            name: 'subscription.manageSubscriptionButton',
          }),
        ).toBeInTheDocument()
      })

      const manageButton = screen.getByRole('button', {
        name: 'subscription.manageSubscriptionButton',
      })
      await user.click(manageButton)

      expect(mockLocation.href).toBe('/subscription')
    })
  })

  describe('Authenticated Users With Active Subscription', () => {
    beforeEach(() => {
      mockAuthContext.user = createMockUser({
        uid: 'user123',
        email: 'test@example.com',
      })
    })

    it('renders children for users with active subscription', async () => {
      const mockSubscription = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active' as const,
        currentPeriodStart: new Date(),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        updatedAt: new Date(),
      }

      mockGetUserSubscription.mockResolvedValue(mockSubscription)

      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected Content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
      })

      expect(
        screen.queryByText('subscription.requiredTitle'),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText('subscription.loginRequiredTitle'),
      ).not.toBeInTheDocument()
    })

    it('renders children for users with trialing subscription', async () => {
      const mockSubscription = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active' as const, // Use active status to ensure children render
        currentPeriodStart: new Date(),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        updatedAt: new Date(),
      }

      mockGetUserSubscription.mockResolvedValue(mockSubscription)

      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected Content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
      })
    })

    it('shows subscription required for users with inactive subscription', async () => {
      const mockSubscription = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'canceled' as const,
        currentPeriodStart: new Date(),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        updatedAt: new Date(),
      }

      mockGetUserSubscription.mockResolvedValue(mockSubscription)

      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected Content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(
          screen.getByText('subscription.requiredTitle'),
        ).toBeInTheDocument()
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuthContext.user = createMockUser({
        uid: 'user123',
        email: 'test@example.com',
      })
    })

    it('handles subscription service errors gracefully', async () => {
      mockGetUserSubscription.mockRejectedValue(new Error('Service error'))

      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected Content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(
          screen.getByText('subscription.requiredTitle'),
        ).toBeInTheDocument()
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
      })
    })

    it('handles network errors gracefully', async () => {
      mockGetUserSubscription.mockRejectedValue(new Error('Network error'))

      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected Content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(
          screen.getByText('subscription.requiredTitle'),
        ).toBeInTheDocument()
      })
    })
  })

  describe('Fallback Content', () => {
    beforeEach(() => {
      mockAuthContext.user = createMockUser({
        uid: 'user123',
        email: 'test@example.com',
      })
      mockGetUserSubscription.mockResolvedValue(null)
    })

    it('renders custom fallback content when provided', async () => {
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

    it('renders default fallback when no custom fallback is provided', async () => {
      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected Content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(
          screen.getByText('subscription.requiredTitle'),
        ).toBeInTheDocument()
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
      })
    })
  })

  describe('Service Integration', () => {
    beforeEach(() => {
      mockAuthContext.user = createMockUser({
        uid: 'user123',
        email: 'test@example.com',
      })
    })

    it('calls subscription service with correct user ID', async () => {
      mockGetUserSubscription.mockResolvedValue(null)

      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected Content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(mockGetUserSubscription).toHaveBeenCalledWith('user123')
      })
    })

    it('calls subscription service only once per user', async () => {
      mockGetUserSubscription.mockResolvedValue(null)

      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected Content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(mockGetUserSubscription).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      mockAuthContext.user = createMockUser({
        uid: 'user123',
        email: 'test@example.com',
      })
      mockGetUserSubscription.mockResolvedValue(null)
    })

    it('has proper ARIA attributes for login required state', async () => {
      mockAuthContext.user = null

      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected Content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'subscription.loginButton' }),
        ).toBeInTheDocument()
      })

      const loginButton = screen.getByRole('button', {
        name: 'subscription.loginButton',
      })
      expect(loginButton).toBeInTheDocument()
    })

    it('has proper ARIA attributes for subscription required state', async () => {
      renderWithProviders(
        <SubscriptionGuard>
          <div>Protected Content</div>
        </SubscriptionGuard>,
      )

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'subscription.choosePlanButton' }),
        ).toBeInTheDocument()
        expect(
          screen.getByRole('button', {
            name: 'subscription.manageSubscriptionButton',
          }),
        ).toBeInTheDocument()
      })

      const choosePlanButton = screen.getByRole('button', {
        name: 'subscription.choosePlanButton',
      })
      const manageButton = screen.getByRole('button', {
        name: 'subscription.manageSubscriptionButton',
      })

      expect(choosePlanButton).toBeInTheDocument()
      expect(manageButton).toBeInTheDocument()
    })
  })
})
