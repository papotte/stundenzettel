import { StripeService } from '../stripe-service'

// Mock fetch
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('StripeService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getPricingPlans', () => {
    it('fetches and transforms pricing plans successfully', async () => {
      const mockStripeProducts = [
        {
          id: 'prod_123',
          name: 'Basic Plan',
          description: 'Basic features',
          metadata: { type: 'individual' },
          prices: [
            {
              id: 'price_123',
              product: 'prod_123',
              unit_amount: 1000,
              currency: 'usd',
              recurring: { interval: 'month' },
              metadata: {},
            },
          ],
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStripeProducts,
      } as Response)

      const result = await StripeService.getPricingPlans()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'basic-plan-month',
        name: 'Basic Plan Monthly',
        price: 10,
        currency: 'USD',
        interval: 'month',
        features: expect.any(Array),
        stripePriceId: 'price_123',
        maxUsers: undefined,
        tieredPricing: undefined,
        trialDays: undefined,
        trialEnabled: false,
      })
    })

    it('handles team plans with max users', async () => {
      const mockStripeProducts = [
        {
          id: 'prod_456',
          name: 'Team Plan',
          description: 'Team features',
          metadata: { type: 'team', max_users: '25' },
          prices: [
            {
              id: 'price_456',
              product: 'prod_456',
              unit_amount: 5000,
              currency: 'usd',
              recurring: { interval: 'month' },
              metadata: {},
            },
          ],
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStripeProducts,
      } as Response)

      const result = await StripeService.getPricingPlans()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'team-plan-month',
        name: 'Team Plan Monthly',
        price: 50,
        currency: 'USD',
        interval: 'month',
        features: expect.any(Array),
        stripePriceId: 'price_456',
        maxUsers: 25,
        tieredPricing: undefined,
        trialDays: undefined,
        trialEnabled: false,
      })
    })

    it('handles yearly plans', async () => {
      const mockStripeProducts = [
        {
          id: 'prod_789',
          name: 'Pro Plan',
          description: 'Pro features',
          metadata: { type: 'individual' },
          prices: [
            {
              id: 'price_789',
              product: 'prod_789',
              unit_amount: 12000,
              currency: 'usd',
              recurring: { interval: 'year' },
              metadata: {},
            },
          ],
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStripeProducts,
      } as Response)

      const result = await StripeService.getPricingPlans()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'pro-plan-year',
        name: 'Pro Plan Yearly',
        price: 120,
        currency: 'USD',
        interval: 'year',
        features: expect.any(Array),
        stripePriceId: 'price_789',
        maxUsers: undefined,
        tieredPricing: undefined,
        trialDays: undefined,
        trialEnabled: false,
      })
    })

    it('handles tiered pricing', async () => {
      const mockStripeProducts = [
        {
          id: 'prod_tiered',
          name: 'Tiered Plan',
          description: 'Tiered pricing',
          metadata: { type: 'team', max_users: '50' },
          prices: [
            {
              id: 'price_tiered',
              product: 'prod_tiered',
              unit_amount: 1000,
              currency: 'usd',
              recurring: { interval: 'month' },
              metadata: {},
              tiers: [
                { up_to: 10, unit_amount: 1000, flat_amount: null },
                { up_to: 50, unit_amount: 800, flat_amount: null },
              ],
            },
          ],
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStripeProducts,
      } as Response)

      const result = await StripeService.getPricingPlans()

      expect(result).toHaveLength(1)
      expect(result[0].tieredPricing).toBeDefined()
      expect(result[0].tieredPricing?.tiers).toHaveLength(2)
      expect(result[0].tieredPricing?.displayText).toContain('Starting at $10')
    })

    it('handles products with multiple prices', async () => {
      const mockStripeProducts = [
        {
          id: 'prod_multi',
          name: 'Multi Price Plan',
          description: 'Multiple prices',
          metadata: { type: 'individual' },
          prices: [
            {
              id: 'price_monthly',
              product: 'prod_multi',
              unit_amount: 1000,
              currency: 'usd',
              recurring: { interval: 'month' },
              metadata: {},
            },
            {
              id: 'price_yearly',
              product: 'prod_multi',
              unit_amount: 10000,
              currency: 'usd',
              recurring: { interval: 'year' },
              metadata: {},
            },
          ],
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStripeProducts,
      } as Response)

      const result = await StripeService.getPricingPlans()

      expect(result).toHaveLength(2)
      expect(result[0].interval).toBe('month')
      expect(result[1].interval).toBe('year')
    })

    it('handles API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await StripeService.getPricingPlans()

      // Should return fallback plans
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('handles non-ok API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)

      const result = await StripeService.getPricingPlans()

      // Should return fallback plans
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('calls correct API endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      await StripeService.getPricingPlans()

      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/products')
    })

    it('handles products with display price metadata', async () => {
      const mockStripeProducts = [
        {
          id: 'prod_display',
          name: 'Display Price Plan',
          description: 'With display price',
          metadata: { type: 'individual', display_price_id: 'price_display' },
          prices: [
            {
              id: 'price_regular',
              product: 'prod_display',
              unit_amount: 1000,
              currency: 'usd',
              recurring: { interval: 'month' },
              metadata: {},
            },
            {
              id: 'price_display',
              product: 'prod_display',
              unit_amount: 800,
              currency: 'usd',
              recurring: { interval: 'month' },
              metadata: {},
            },
          ],
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStripeProducts,
      } as Response)

      const result = await StripeService.getPricingPlans()

      expect(result).toHaveLength(1)
      expect(result[0].stripePriceId).toBe('price_display')
      expect(result[0].price).toBe(8) // Should use display price
    })

    it('handles products with zero or null prices', async () => {
      const mockStripeProducts = [
        {
          id: 'prod_zero',
          name: 'Zero Price Plan',
          description: 'Zero price',
          metadata: { type: 'individual' },
          prices: [
            {
              id: 'price_zero',
              product: 'prod_zero',
              unit_amount: 0,
              currency: 'usd',
              recurring: { interval: 'month' },
              metadata: {},
            },
            {
              id: 'price_null',
              product: 'prod_zero',
              unit_amount: null,
              currency: 'usd',
              recurring: { interval: 'month' },
              metadata: {},
            },
          ],
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStripeProducts,
      } as Response)

      const result = await StripeService.getPricingPlans()

      expect(result).toHaveLength(1)
      expect(result[0].price).toBe(0)
    })
  })
})
