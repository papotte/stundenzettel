import { NextRequest } from 'next/server'

import { GET } from '../[userId]/route'

// Mock the Stripe subscriptions service
jest.mock('@/services/stripe/subscriptions', () => ({
  getUserSubscription: jest.fn(),
}))

const mockGetUserSubscription = jest.mocked(
  require('@/services/stripe/subscriptions').getUserSubscription,
)

describe('/api/subscriptions/[userId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockParams = (userId: string) => {
    return Promise.resolve({ userId })
  }

  describe('GET', () => {
    it('should fetch user subscription successfully', async () => {
      const userId = 'user123'
      const mockSubscription = {
        id: 'sub_123',
        status: 'active',
        current_period_end: 1234567890,
        cancel_at_period_end: false,
        product: {
          id: 'prod_123',
          name: 'Basic Plan',
        },
        price: {
          id: 'price_123',
          unit_amount: 1000,
          currency: 'usd',
          recurring: { interval: 'month' },
        },
      }

      mockGetUserSubscription.mockResolvedValue(mockSubscription)

      const request = {} as NextRequest
      const params = createMockParams(userId)
      const response = await GET(request, { params })

      expect(mockGetUserSubscription).toHaveBeenCalledWith(userId)
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(mockSubscription)
    })

    it('should return 400 when userId is missing', async () => {
      const params = Promise.resolve({ userId: '' })

      const request = {} as NextRequest
      const response = await GET(request, { params })

      expect(mockGetUserSubscription).not.toHaveBeenCalled()
      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'User ID is required',
      })
    })

    it('should return 400 when userId is null', async () => {
      const params = Promise.resolve({ userId: null as any })

      const request = {} as NextRequest
      const response = await GET(request, { params })

      expect(mockGetUserSubscription).not.toHaveBeenCalled()
      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'User ID is required',
      })
    })

    it('should return 400 when userId is undefined', async () => {
      const params = Promise.resolve({ userId: undefined as any })

      const request = {} as NextRequest
      const response = await GET(request, { params })

      expect(mockGetUserSubscription).not.toHaveBeenCalled()
      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'User ID is required',
      })
    })

    it('should handle service errors gracefully', async () => {
      const userId = 'user123'
      mockGetUserSubscription.mockRejectedValue(new Error('Stripe API error'))

      const request = {} as NextRequest
      const params = createMockParams(userId)
      const response = await GET(request, { params })

      expect(mockGetUserSubscription).toHaveBeenCalledWith(userId)
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Failed to fetch subscription',
      })
    })

    it('should handle User ID is required error from service', async () => {
      const userId = 'user123'
      mockGetUserSubscription.mockRejectedValue(
        new Error('User ID is required'),
      )

      const request = {} as NextRequest
      const params = createMockParams(userId)
      const response = await GET(request, { params })

      expect(mockGetUserSubscription).toHaveBeenCalledWith(userId)
      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'User ID is required',
      })
    })

    it('should handle unknown errors', async () => {
      const userId = 'user123'
      mockGetUserSubscription.mockRejectedValue('Unknown error')

      const request = {} as NextRequest
      const params = createMockParams(userId)
      const response = await GET(request, { params })

      expect(mockGetUserSubscription).toHaveBeenCalledWith(userId)
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Failed to fetch subscription',
      })
    })

    it('should handle null subscription from service', async () => {
      const userId = 'user123'
      mockGetUserSubscription.mockResolvedValue(null)

      const request = {} as NextRequest
      const params = createMockParams(userId)
      const response = await GET(request, { params })

      expect(mockGetUserSubscription).toHaveBeenCalledWith(userId)
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toBeNull()
    })

    it('should handle params promise rejection', async () => {
      const params = Promise.reject(new Error('Params error'))

      const request = {} as NextRequest
      const response = await GET(request, { params })

      expect(mockGetUserSubscription).not.toHaveBeenCalled()
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Failed to fetch subscription',
      })
    })
  })
})
