import { _resetPricingPlansCacheForTest, getPricingPlans, paymentService } from '../payment-service'
import { StripeService } from '../stripe-service'

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({})),
}))

// Mock StripeService
jest.mock('../stripe-service', () => ({
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
  })

  describe('getPricingPlans (function)', () => {
    beforeEach(() => {
      _resetPricingPlansCacheForTest()
    })
    it('returns cached plans if available and not expired', async () => {
      const mockPlans = [
        {
          id: 'plan-1',
          name: 'Basic Plan',
          price: 10,
          currency: 'USD',
          interval: 'month' as const,
          features: ['Feature 1'],
          stripePriceId: 'price_1',
        },
      ]

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
      // Clear mocks and reset modules to ensure fresh state
      jest.clearAllMocks()
      jest.resetModules()

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
            priceId: 'price_123',
            successUrl: 'https://success.com',
            cancelUrl: 'https://cancel.com',
          }),
        })
      })

      it('throws error when API call fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response)

        await expect(
          paymentService.createCheckoutSession('user123', 'price_123'),
        ).rejects.toThrow('Failed to create checkout session')
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
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response)

        await expect(
          paymentService.createCustomerPortalSession('user123'),
        ).rejects.toThrow('Failed to create customer portal session')
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
})
