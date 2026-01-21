import type { StripeProduct } from '@/services/stripe/products'
import * as stripeProducts from '@/services/stripe/products'

import { GET } from '../products/route'

// Mock the Stripe products service (route uses getCachedStripeProducts)
jest.mock('@/services/stripe/products', () => ({
  getCachedStripeProducts: jest.fn(),
  getStripeProducts: jest.fn(),
}))

const mockGetCachedStripeProducts = jest.mocked(
  stripeProducts.getCachedStripeProducts,
)

describe('/api/stripe/products', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should fetch products successfully', async () => {
      const mockProducts = [
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
              recurring: { interval: 'month', interval_count: 1 },
              metadata: {},
            },
          ],
        },
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
              recurring: { interval: 'month', interval_count: 1 },
              metadata: {},
            },
          ],
        },
      ] as StripeProduct[]

      mockGetCachedStripeProducts.mockResolvedValue(mockProducts)

      const response = await GET()

      expect(mockGetCachedStripeProducts).toHaveBeenCalledWith()
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(mockProducts)
    })

    it('should return empty array when no products exist', async () => {
      mockGetCachedStripeProducts.mockResolvedValue([])

      const response = await GET()

      expect(mockGetCachedStripeProducts).toHaveBeenCalledWith()
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual([])
    })

    it('should handle service errors gracefully', async () => {
      mockGetCachedStripeProducts.mockRejectedValue(
        new Error('Stripe API error'),
      )

      const response = await GET()

      expect(mockGetCachedStripeProducts).toHaveBeenCalledWith()
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Stripe API error',
      })
    })

    it('should handle unknown errors', async () => {
      mockGetCachedStripeProducts.mockRejectedValue('Unknown error')

      const response = await GET()

      expect(mockGetCachedStripeProducts).toHaveBeenCalledWith()
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Unknown error',
      })
    })

    it('should handle errors without message property', async () => {
      const errorWithoutMessage = {}
      mockGetCachedStripeProducts.mockRejectedValue(errorWithoutMessage)

      const response = await GET()

      expect(mockGetCachedStripeProducts).toHaveBeenCalledWith()
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Unknown error',
      })
    })

    it('should handle null error', async () => {
      mockGetCachedStripeProducts.mockRejectedValue(null)

      const response = await GET()

      expect(mockGetCachedStripeProducts).toHaveBeenCalledWith()
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Unknown error',
      })
    })
  })
})
