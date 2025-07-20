import { NextRequest } from 'next/server'

import { POST } from '../create-checkout-session/route'

// Mock the Stripe service
jest.mock('@/services/stripe', () => ({
  createCheckoutSession: jest.fn(),
}))

const mockCreateCheckoutSession = jest.mocked(
  require('@/services/stripe').createCheckoutSession,
)

describe('/api/create-checkout-session', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (body: any, origin = 'http://localhost:3000') => {
    return {
      json: jest.fn().mockResolvedValue(body),
      nextUrl: { origin },
    } as unknown as NextRequest
  }

  describe('POST', () => {
    it('should create checkout session successfully', async () => {
      const mockBody = {
        userId: 'user123',
        userEmail: 'test@example.com',
        priceId: 'price_123',
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel',
      }

      const mockResult = {
        url: 'https://checkout.stripe.com/session_123',
        sessionId: 'cs_123',
      }

      mockCreateCheckoutSession.mockResolvedValue(mockResult)

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
        userId: 'user123',
        userEmail: 'test@example.com',
        priceId: 'price_123',
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel',
        origin: 'http://localhost:3000',
      })

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(mockResult)
    })

    it('should return 400 when userId is missing', async () => {
      const mockBody = {
        userEmail: 'test@example.com',
        priceId: 'price_123',
      }

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Missing required parameters',
      })
      expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
    })

    it('should return 400 when userEmail is missing', async () => {
      const mockBody = {
        userId: 'user123',
        priceId: 'price_123',
      }

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Missing required parameters',
      })
      expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
    })

    it('should return 400 when priceId is missing', async () => {
      const mockBody = {
        userId: 'user123',
        userEmail: 'test@example.com',
      }

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Missing required parameters',
      })
      expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
    })

    it('should handle service errors gracefully', async () => {
      const mockBody = {
        userId: 'user123',
        userEmail: 'test@example.com',
        priceId: 'price_123',
      }

      mockCreateCheckoutSession.mockRejectedValue(
        new Error('Stripe service error'),
      )

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Failed to create checkout session',
      })
    })

    it('should handle Missing required parameters error from service', async () => {
      const mockBody = {
        userId: 'user123',
        userEmail: 'test@example.com',
        priceId: 'price_123',
      }

      mockCreateCheckoutSession.mockRejectedValue(
        new Error('Missing required parameters'),
      )

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Missing required parameters',
      })
    })

    it('should handle unknown errors', async () => {
      const mockBody = {
        userId: 'user123',
        userEmail: 'test@example.com',
        priceId: 'price_123',
      }

      mockCreateCheckoutSession.mockRejectedValue('Unknown error')

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Failed to create checkout session',
      })
    })

    it('should handle JSON parsing errors', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        nextUrl: { origin: 'http://localhost:3000' },
      } as unknown as NextRequest

      const response = await POST(request)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Failed to create checkout session',
      })
    })
  })
})
