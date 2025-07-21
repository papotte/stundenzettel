import * as stripeProductsService from '@/services/stripe/products'

import { GET } from '../products/route'

// Mock the Stripe products service
jest.mock('@/services/stripe/products', () => ({
  getStripeProducts: jest.fn(),
}))

const mockGetStripeProducts = jest.mocked(
  stripeProductsService.getStripeProducts,
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
      ] as stripeProductsService.StripeProduct[]

      mockGetStripeProducts.mockResolvedValue(mockProducts)

      const response = await GET()

      expect(mockGetStripeProducts).toHaveBeenCalledWith()
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(mockProducts)
    })

    it('should return empty array when no products exist', async () => {
      mockGetStripeProducts.mockResolvedValue([])

      const response = await GET()

      expect(mockGetStripeProducts).toHaveBeenCalledWith()
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual([])
    })

    it('should handle service errors gracefully', async () => {
      mockGetStripeProducts.mockRejectedValue(new Error('Stripe API error'))

      const response = await GET()

      expect(mockGetStripeProducts).toHaveBeenCalledWith()
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Stripe API error',
      })
    })

    it('should handle unknown errors', async () => {
      mockGetStripeProducts.mockRejectedValue('Unknown error')

      const response = await GET()

      expect(mockGetStripeProducts).toHaveBeenCalledWith()
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Unknown error',
      })
    })

    it('should handle errors without message property', async () => {
      const errorWithoutMessage = {}
      mockGetStripeProducts.mockRejectedValue(errorWithoutMessage)

      const response = await GET()

      expect(mockGetStripeProducts).toHaveBeenCalledWith()
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Unknown error',
      })
    })

    it('should handle null error', async () => {
      mockGetStripeProducts.mockRejectedValue(null)

      const response = await GET()

      expect(mockGetStripeProducts).toHaveBeenCalledWith()
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Unknown error',
      })
    })
  })
})
