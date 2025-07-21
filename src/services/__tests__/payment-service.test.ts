import type { PricingPlan } from '@/lib/types'
import {
  _resetPricingPlansCacheForTest,
  getPricingPlans,
  paymentService,
} from '@/services/payment-service'
import { StripeService } from '@/services/stripe-service'

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() =>
    Promise.resolve({
      redirectToCheckout: jest.fn(),
    }),
  ),
}))

// Mock StripeService
jest.mock('@/services/stripe-service', () => ({
  StripeService: {
    getPricingPlans: jest.fn(),
  },
}))

// Mock fetch
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

const mockStripeService = StripeService as jest.Mocked<typeof StripeService>

describe('PaymentService', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    _resetPricingPlansCacheForTest()
  })

  describe('getPricingPlans (function)', () => {
    const mockPlans: PricingPlan[] = [
      {
        id: 'plan-1',
        name: 'Basic Plan',
        price: 10,
        currency: 'USD',
        interval: 'month',
        features: ['Feature 1'],
        stripePriceId: 'price_1',
      },
    ]

    it('returns cached plans if available and not expired', async () => {
      mockStripeService.getPricingPlans.mockResolvedValue(mockPlans)

      // First call to populate cache
      const result1 = await getPricingPlans()
      expect(result1).toEqual(mockPlans)

      // Second call should use cache
      const result2 = await getPricingPlans()
      expect(result2).toEqual(mockPlans)
      expect(mockStripeService.getPricingPlans).toHaveBeenCalledTimes(1)
    })

    it('handles API errors gracefully', async () => {
      // Mock StripeService to reject
      mockStripeService.getPricingPlans.mockRejectedValue(
        new Error('API Error'),
      )

      const result = await getPricingPlans()
      expect(result).toEqual([]) // Should return fallback plans
    })
  })

  describe('PaymentService class', () => {
    describe('createCheckoutSession', () => {
      it('creates checkout session successfully', async () => {
        const mockResponse = {
          sessionId: 'cs_123',
          url: 'https://checkout.stripe.com/123',
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response)

        const result = await paymentService.createCheckoutSession(
          'user123',
          'user@test.com',
          'price_123',
          'https://success.com',
          'https://cancel.com',
        )

        expect(result).toEqual(mockResponse)
        expect(mockFetch).toHaveBeenCalledWith('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: 'user123',
            userEmail: 'user@test.com',
            priceId: 'price_123',
            successUrl: 'https://success.com',
            cancelUrl: 'https://cancel.com',
          }),
        })
      })

      it('throws error when API call fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network Error'))

        await expect(
          paymentService.createCheckoutSession(
            'user123',
            'user@test.com',
            'price_123',
          ),
        ).rejects.toThrow('Network Error')
      })
    })

    describe('createTeamCheckoutSession', () => {
      it('creates team checkout session successfully', async () => {
        const mockResponse = {
          sessionId: 'cs_123',
          url: 'https://checkout.stripe.com/123',
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response)

        const result = await paymentService.createTeamCheckoutSession(
          'user123',
          'team123',
          'price_123',
          5,
          'https://success.com',
          'https://cancel.com',
        )

        expect(result).toEqual(mockResponse)
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/create-team-checkout-session',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: 'user123',
              teamId: 'team123',
              priceId: 'price_123',
              quantity: 5,
              successUrl: 'https://success.com',
              cancelUrl: 'https://cancel.com',
            }),
          },
        )
      })

      it('throws error when API call fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response)

        await expect(
          paymentService.createTeamCheckoutSession(
            'user123',
            'team123',
            'price_123',
            5,
          ),
        ).rejects.toThrow('Failed to create team checkout session')
      })
    })

    describe('createCustomerPortalSession', () => {
      it('creates customer portal session successfully', async () => {
        const mockResponse = {
          url: 'https://billing.stripe.com/portal',
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response)

        const result = await paymentService.createCustomerPortalSession(
          'user123',
          'https://return.com',
        )

        expect(result).toEqual(mockResponse)
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/create-customer-portal-session',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: 'user123',
              returnUrl: 'https://return.com',
            }),
          },
        )
      })

      it('throws error when API call fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network Error'))

        await expect(
          paymentService.createCustomerPortalSession('user123'),
        ).rejects.toThrow('Network Error')
      })
    })

    describe('redirectToCheckout', () => {
      it('redirects to checkout URL', async () => {
        // Mock window.location
        const originalLocation = window.location
        Object.defineProperty(window, 'location', {
          value: { href: '' },
          writable: true,
        })

        await paymentService.redirectToCheckout(
          'https://checkout.stripe.com/123',
        )

        expect(window.location.href).toBe('https://checkout.stripe.com/123')

        // Restore original location
        Object.defineProperty(window, 'location', {
          value: originalLocation,
          writable: true,
        })
      })
    })

    describe('redirectToCustomerPortal', () => {
      it('redirects to customer portal URL', async () => {
        // Mock window.location
        const originalLocation = window.location
        Object.defineProperty(window, 'location', {
          value: { href: '' },
          writable: true,
        })

        await paymentService.redirectToCustomerPortal(
          'https://billing.stripe.com/portal',
        )

        expect(window.location.href).toBe('https://billing.stripe.com/portal')

        // Restore original location
        Object.defineProperty(window, 'location', {
          value: originalLocation,
          writable: true,
        })
      })
    })

    describe('plan filtering methods', () => {
      it('getIndividualPlans returns empty array when no plans', () => {
        const individualPlans = paymentService.getIndividualPlans()
        expect(individualPlans).toEqual([])
      })

      it('getTeamPlans returns empty array when no plans', () => {
        const teamPlans = paymentService.getTeamPlans()
        expect(teamPlans).toEqual([])
      })

      it('getPlanById returns undefined for non-existent plan', () => {
        const plan = paymentService.getPlanById('non-existent')
        expect(plan).toBeUndefined()
      })

      it('getPlanByStripePriceId returns undefined for non-existent plan', () => {
        const plan = paymentService.getPlanByStripePriceId('non-existent')
        expect(plan).toBeUndefined()
      })
    })
  })

  describe('Cache Management', () => {
    it('resets cache correctly in test environment', () => {
      expect(() => _resetPricingPlansCacheForTest()).not.toThrow()
    })

    it('throws error when resetting cache outside test environment', () => {
      // Mock NODE_ENV to be production
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
      })

      expect(() => _resetPricingPlansCacheForTest()).toThrow(
        '_resetPricingPlansCacheForTest can only be called in test environment',
      )

      // Restore original environment
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
      })
    })
  })

  describe('Integration Scenarios', () => {
    it('handles complete checkout flow', async () => {
      // Mock pricing plans
      const mockPricingPlans: PricingPlan[] = [
        {
          id: 'individual-monthly',
          name: 'Individual Monthly',
          price: 9.99,
          currency: 'EUR',
          interval: 'month',
          features: ['Feature 1'],
          stripePriceId: 'price_monthly',
        },
      ]
      mockStripeService.getPricingPlans.mockResolvedValue(mockPricingPlans)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessionId: 'cs_test_123',
          url: 'https://checkout.stripe.com/test',
        }),
      } as Response)

      // Get pricing plans
      const plans = await getPricingPlans()
      expect(plans).toEqual(mockPricingPlans)

      // Create checkout session
      const checkoutResult = await paymentService.createCheckoutSession(
        'user123',
        'test@example.com',
        'price_monthly',
      )

      expect(checkoutResult).toEqual({
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockStripeService.getPricingPlans).toHaveBeenCalledTimes(1)
    })

    it('handles customer portal flow', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          url: 'https://billing.stripe.com/test',
        }),
      } as Response)

      const portalResult = await paymentService.createCustomerPortalSession(
        'test@example.com',
        'http://localhost:3000/return',
      )

      expect(portalResult).toEqual({
        url: 'https://billing.stripe.com/test',
      })
    })
  })
})
