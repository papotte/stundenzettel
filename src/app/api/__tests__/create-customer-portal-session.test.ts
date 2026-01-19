import { NextRequest } from 'next/server'

import * as stripeService from '@/services/stripe'

import { POST } from '../create-customer-portal-session/route'

// Mock the Stripe service
jest.mock('@/services/stripe', () => ({
  createCustomerPortalSession: jest.fn(),
}))

const mockCreateCustomerPortalSession = jest.mocked(
  stripeService.createCustomerPortalSession,
)

describe('/api/create-customer-portal-session', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (
    body: Record<string, unknown>,
    origin = 'http://localhost:3000',
  ) => {
    return {
      json: jest.fn().mockResolvedValue(body),
      nextUrl: { origin },
    } as unknown as NextRequest
  }

  describe('POST', () => {
    it('should create customer portal session successfully', async () => {
      const mockBody = {
        userId: 'user123',
        returnUrl: 'http://localhost:3000/account',
      }

      const mockResult = {
        url: 'https://billing.stripe.com/session_123',
        sessionId: 'bps_123',
      }

      mockCreateCustomerPortalSession.mockResolvedValue(mockResult)

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(mockCreateCustomerPortalSession).toHaveBeenCalledWith({
        userId: 'user123',
        returnUrl: 'http://localhost:3000/account',
        origin: 'http://localhost:3000',
      })

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(mockResult)
    })

    it('should return 400 when userId is missing', async () => {
      const mockBody = {
        returnUrl: 'http://localhost:3000/account',
      }

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Missing required parameters',
      })
      expect(mockCreateCustomerPortalSession).not.toHaveBeenCalled()
    })

    it('should handle Customer not found error from service', async () => {
      const mockBody = {
        userId: 'user123',
        returnUrl: 'http://localhost:3000/account',
      }

      mockCreateCustomerPortalSession.mockRejectedValue(
        new Error('Customer not found'),
      )

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(404)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Customer not found',
      })
    })

    it('should handle Missing required parameters error from service', async () => {
      const mockBody = {
        userId: 'user123',
        returnUrl: 'http://localhost:3000/account',
      }

      mockCreateCustomerPortalSession.mockRejectedValue(
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

    it('should handle service errors gracefully', async () => {
      const mockBody = {
        userId: 'user123',
        returnUrl: 'http://localhost:3000/account',
      }

      mockCreateCustomerPortalSession.mockRejectedValue(
        new Error('Stripe service error'),
      )

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Failed to create customer portal session',
      })
    })

    it('should handle unknown errors', async () => {
      const mockBody = {
        userId: 'user123',
        returnUrl: 'http://localhost:3000/account',
      }

      mockCreateCustomerPortalSession.mockRejectedValue('Unknown error')

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Failed to create customer portal session',
      })
    })

    it('should return 400 when JSON body is invalid or missing', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        nextUrl: { origin: 'http://localhost:3000' },
      } as unknown as NextRequest

      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Invalid or missing JSON body',
      })
      expect(mockCreateCustomerPortalSession).not.toHaveBeenCalled()
    })

    it('should work without returnUrl parameter', async () => {
      const mockBody = {
        userId: 'user123',
      }

      const mockResult = {
        url: 'https://billing.stripe.com/session_123',
        sessionId: 'bps_123',
      }

      mockCreateCustomerPortalSession.mockResolvedValue(mockResult)

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(mockCreateCustomerPortalSession).toHaveBeenCalledWith({
        userId: 'user123',
        returnUrl: undefined,
        origin: 'http://localhost:3000',
      })

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(mockResult)
    })
  })
})
