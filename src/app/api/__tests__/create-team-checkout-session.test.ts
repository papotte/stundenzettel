import { NextRequest } from 'next/server'

import * as stripeService from '@/services/stripe'
import * as teamService from '@/services/team-service'

import { POST } from '../create-team-checkout-session/route'

// Mock the Stripe service
jest.mock('@/services/stripe', () => ({
  createTeamCheckoutSession: jest.fn(),
}))

// Mock the Team service
jest.mock('@/services/team-service', () => ({
  getTeamMembers: jest.fn(),
}))

const mockCreateTeamCheckoutSession = jest.mocked(
  stripeService.createTeamCheckoutSession,
)
const mockGetTeamMembers = jest.mocked(teamService.getTeamMembers)

describe('/api/create-team-checkout-session', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetTeamMembers.mockResolvedValue([
      {
        id: 'user123',
        email: 'owner@example.com',
        role: 'admin',
        joinedAt: new Date(),
        invitedBy: 'user123',
      },
    ])
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
    it('should create team checkout session successfully', async () => {
      const mockBody = {
        userId: 'user123',
        teamId: 'team456',
        priceId: 'price_123',
        quantity: 5,
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel',
      }

      const mockResult = {
        url: 'https://checkout.stripe.com/session_123',
        sessionId: 'cs_123',
      }

      mockCreateTeamCheckoutSession.mockResolvedValue(mockResult)

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(mockCreateTeamCheckoutSession).toHaveBeenCalledWith({
        userId: 'user123',
        teamId: 'team456',
        priceId: 'price_123',
        quantity: 5,
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
        teamId: 'team456',
        priceId: 'price_123',
        quantity: 5,
      }

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Missing required parameters',
      })
      expect(mockCreateTeamCheckoutSession).not.toHaveBeenCalled()
    })

    it('should return 400 when teamId is missing', async () => {
      const mockBody = {
        userId: 'user123',
        priceId: 'price_123',
        quantity: 5,
      }

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Missing required parameters',
      })
      expect(mockCreateTeamCheckoutSession).not.toHaveBeenCalled()
    })

    it('should return 400 when priceId is missing', async () => {
      const mockBody = {
        userId: 'user123',
        teamId: 'team456',
        quantity: 5,
      }

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Missing required parameters',
      })
      expect(mockCreateTeamCheckoutSession).not.toHaveBeenCalled()
    })

    it('should return 400 when quantity is missing', async () => {
      const mockBody = {
        userId: 'user123',
        teamId: 'team456',
        priceId: 'price_123',
      }

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Missing required parameters',
      })
      expect(mockCreateTeamCheckoutSession).not.toHaveBeenCalled()
    })

    it('should handle service errors gracefully', async () => {
      const mockBody = {
        userId: 'user123',
        teamId: 'team456',
        priceId: 'price_123',
        quantity: 5,
      }

      mockCreateTeamCheckoutSession.mockRejectedValue(
        new Error('Stripe service error'),
      )

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Failed to create team checkout session',
      })
    })

    it('should handle Missing required parameters error from service', async () => {
      const mockBody = {
        userId: 'user123',
        teamId: 'team456',
        priceId: 'price_123',
        quantity: 5,
      }

      mockCreateTeamCheckoutSession.mockRejectedValue(
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

    it('should return 403 when user is not an admin', async () => {
      const mockBody = {
        userId: 'user123',
        teamId: 'team456',
        priceId: 'price_123',
        quantity: 5,
      }

      mockGetTeamMembers.mockResolvedValue([
        {
          id: 'user123',
          email: 'member@example.com',
          role: 'member',
          joinedAt: new Date(),
          invitedBy: 'user789',
        },
      ])

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(403)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Insufficient permissions to create team subscription',
      })
      expect(mockCreateTeamCheckoutSession).not.toHaveBeenCalled()
    })

    it('should handle unknown errors', async () => {
      const mockBody = {
        userId: 'user123',
        teamId: 'team456',
        priceId: 'price_123',
        quantity: 5,
      }

      mockCreateTeamCheckoutSession.mockRejectedValue('Unknown error')

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Failed to create team checkout session',
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
        error: 'Failed to create team checkout session',
      })
    })

    it('should work without optional URL parameters', async () => {
      const mockBody = {
        userId: 'user123',
        teamId: 'team456',
        priceId: 'price_123',
        quantity: 5,
      }

      const mockResult = {
        url: 'https://checkout.stripe.com/session_123',
        sessionId: 'cs_123',
      }

      mockCreateTeamCheckoutSession.mockResolvedValue(mockResult)

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(mockCreateTeamCheckoutSession).toHaveBeenCalledWith({
        userId: 'user123',
        teamId: 'team456',
        priceId: 'price_123',
        quantity: 5,
        successUrl: undefined,
        cancelUrl: undefined,
        origin: 'http://localhost:3000',
      })

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(mockResult)
    })
  })
})
