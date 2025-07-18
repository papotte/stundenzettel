import React from 'react'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { AuthProvider } from '@/context/auth-context'
import type { PricingPlan } from '@/lib/types'
import { getPricingPlans, paymentService } from '@/services/payment-service'
import { createMockAuthContext } from '@/test-utils/auth-mocks'

import PricingSection from '../pricing-section'

const mockToast = jest.fn()

jest.mock('@/services/payment-service', () => ({
  getPricingPlans: jest.fn(),
  paymentService: {
    createCheckoutSession: jest.fn(),
    redirectToCheckout: jest.fn(),
  },
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

// Mock window.location
const mockLocation = {
  href: '',
  origin: 'http://localhost:3000',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

const mockPricingPlans: PricingPlan[] = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 9.99,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: 'price_basic_monthly',
    features: ['Basic feature 1', 'Basic feature 2'],
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: 19.99,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: 'price_pro_monthly',
    features: ['Pro feature 1', 'Priority support', 'Pro feature 3'],
  },
  {
    id: 'basic-yearly',
    name: 'Basic Plan',
    price: 99.99,
    currency: 'EUR',
    interval: 'year',
    stripePriceId: 'price_basic_yearly',
    features: ['Basic feature 1', 'Basic feature 2'],
  },
  {
    id: 'pro-yearly',
    name: 'Pro Plan',
    price: 199.99,
    currency: 'EUR',
    interval: 'year',
    stripePriceId: 'price_pro_yearly',
    features: ['Pro feature 1', 'Priority support', 'Pro feature 3'],
  },
]

// Use centralized auth mock
const mockAuthContext = createMockAuthContext()

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>)
}

describe('PricingSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthContext.user = null
    mockAuthContext.loading = false
  })

  describe('rendering', () => {
    it('renders with default props', async () => {
      ;(getPricingPlans as jest.Mock).mockResolvedValue(mockPricingPlans)

      render(<PricingSection />)

      expect(screen.getByText('pricing.title')).toBeInTheDocument()
      expect(screen.getByText('pricing.subtitle')).toBeInTheDocument()
      expect(screen.getByText('pricing.loadingPlans')).toBeInTheDocument()

      await waitFor(() => {
        expect(
          screen.queryByText('pricing.loadingPlans'),
        ).not.toBeInTheDocument()
      })
    })

    it('renders landing variant correctly', async () => {
      ;(getPricingPlans as jest.Mock).mockResolvedValue(mockPricingPlans)

      render(<PricingSection variant="landing" />)

      expect(
        screen.getByText('landing.pricing.headerTitle'),
      ).toBeInTheDocument()
      expect(
        screen.getByText('landing.pricing.headerDescription'),
      ).toBeInTheDocument()

      await waitFor(() => {
        expect(
          screen.queryByText('pricing.loadingPlans'),
        ).not.toBeInTheDocument()
      })
    })

    it('hides header when showHeader is false', async () => {
      ;(getPricingPlans as jest.Mock).mockResolvedValue(mockPricingPlans)

      render(<PricingSection showHeader={false} />)

      expect(screen.queryByText('pricing.title')).not.toBeInTheDocument()
      expect(screen.queryByText('pricing.subtitle')).not.toBeInTheDocument()

      await waitFor(() => {
        expect(
          screen.queryByText('pricing.loadingPlans'),
        ).not.toBeInTheDocument()
      })
    })

    it('hides FAQ when showFAQ is false', async () => {
      ;(getPricingPlans as jest.Mock).mockResolvedValue(mockPricingPlans)

      render(<PricingSection showFAQ={false} />)

      await waitFor(() => {
        expect(screen.queryByText('pricing.faqTitle')).not.toBeInTheDocument()
      })
    })
  })

  describe('plan filtering', () => {
    it('shows monthly plans by default', async () => {
      ;(getPricingPlans as jest.Mock).mockResolvedValue(mockPricingPlans)

      render(<PricingSection />)

      await waitFor(() => {
        expect(screen.getByText('Basic Plan')).toBeInTheDocument()
        expect(screen.getByText('Pro Plan')).toBeInTheDocument()
        expect(screen.getByText('€9.99')).toBeInTheDocument()
        expect(screen.getByText('€19.99')).toBeInTheDocument()
      })
    })

    it('filters to yearly plans when toggle is switched', async () => {
      ;(getPricingPlans as jest.Mock).mockResolvedValue(mockPricingPlans)

      render(<PricingSection />)

      await waitFor(() => {
        expect(
          screen.queryByText('pricing.loadingPlans'),
        ).not.toBeInTheDocument()
      })

      const yearlyToggle = screen.getByRole('switch')
      fireEvent.click(yearlyToggle)

      await waitFor(() => {
        expect(screen.getByText('€99.99')).toBeInTheDocument()
        expect(screen.getByText('€199.99')).toBeInTheDocument()
      })
    })
  })

  describe('subscription handling', () => {
    it('redirects to login when user is not authenticated', async () => {
      ;(getPricingPlans as jest.Mock).mockResolvedValue(mockPricingPlans)

      render(<PricingSection />)

      await waitFor(() => {
        expect(
          screen.queryByText('pricing.loadingPlans'),
        ).not.toBeInTheDocument()
      })

      const subscribeButtons = screen.getAllByText('pricing.getStarted')
      fireEvent.click(subscribeButtons[0])

      expect(window.location.href).toContain('/login')
      expect(window.location.href).toContain('returnUrl')
    })

    describe('when user is authenticated', () => {
      beforeEach(() => {
        mockAuthContext.user = {
          uid: 'test-user-id',
          email: 'test@example.com',
          displayName: 'Test User',
        }
        mockAuthContext.loading = false
      })

      it('creates checkout session for authenticated user', async () => {
        ;(getPricingPlans as jest.Mock).mockResolvedValue(mockPricingPlans)
        ;(paymentService.createCheckoutSession as jest.Mock).mockResolvedValue({
          url: 'https://checkout.stripe.com/test',
        })

        renderWithProviders(<PricingSection />)

        await waitFor(() => {
          expect(
            screen.queryByText('pricing.loadingPlans'),
          ).not.toBeInTheDocument()
        })

        const subscribeButtons = screen.getAllByText('pricing.getStarted')
        fireEvent.click(subscribeButtons[0])

        await waitFor(() => {
          expect(paymentService.createCheckoutSession).toHaveBeenCalledWith(
            'test-user-id',
            'test@example.com',
            'price_basic_monthly',
            'http://localhost:3000/subscription?success=true',
            'http://localhost:3000/pricing?canceled=true',
          )
          expect(paymentService.redirectToCheckout).toHaveBeenCalledWith(
            'https://checkout.stripe.com/test',
          )
        })
      })
      it('shows error toast when checkout fails', async () => {
        ;(getPricingPlans as jest.Mock).mockResolvedValue(mockPricingPlans)
        ;(paymentService.createCheckoutSession as jest.Mock).mockRejectedValue(
          new Error('Checkout failed'),
        )

        renderWithProviders(<PricingSection />)

        await waitFor(() => {
          expect(
            screen.queryByText('pricing.loadingPlans'),
          ).not.toBeInTheDocument()
        })

        const subscribeButtons = screen.getAllByText('pricing.getStarted')
        fireEvent.click(subscribeButtons[0])

        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith({
            title: 'pricing.errorTitle',
            description: 'pricing.errorDescription',
            variant: 'destructive',
          })
        })
      })
    })
  })

  describe('error handling', () => {
    it('handles pricing plans loading error gracefully', async () => {
      ;(getPricingPlans as jest.Mock).mockRejectedValue(
        new Error('Failed to load plans'),
      )

      render(<PricingSection />)

      await waitFor(() => {
        expect(
          screen.queryByText('pricing.loadingPlans'),
        ).not.toBeInTheDocument()
      })

      // Should not crash and should show empty state
      expect(screen.queryByText('pricing.getStarted')).not.toBeInTheDocument()
    })
  })
})
