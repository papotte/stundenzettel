import { NextRequest } from 'next/server'

import * as stripeService from '@/services/stripe'

import { POST } from '../sync-team-with-stripe/route'

// Mock the Stripe service
jest.mock('@/services/stripe', () => ({
  syncTeamWithStripe: jest.fn(),
}))

const mockSyncTeamWithStripe = jest.mocked(stripeService.syncTeamWithStripe)

describe('/api/sync-team-with-stripe', () => {
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
    it('should sync team with Stripe successfully', async () => {
      const mockBody = {
        userEmail: 'user@example.com',
        firebaseUid: 'firebase-uid-123',
        teamId: 'team123',
      }

      mockSyncTeamWithStripe.mockResolvedValue(undefined)

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(mockSyncTeamWithStripe).toHaveBeenCalledWith({
        userEmail: 'user@example.com',
        firebaseUid: 'firebase-uid-123',
        teamId: 'team123',
      })

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual({ success: true })
    })

    it.each([
      {
        description: 'userEmail is missing',
        mockBody: {
          firebaseUid: 'firebase-uid-123',
          teamId: 'team123',
        },
      },
      {
        description: 'firebaseUid is missing',
        mockBody: {
          userEmail: 'user@example.com',
          teamId: 'team123',
        },
      },
      {
        description: 'teamId is missing',
        mockBody: {
          userEmail: 'user@example.com',
          firebaseUid: 'firebase-uid-123',
        },
      },
    ])('should return 400 when $description', async ({ mockBody }) => {
      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Missing required parameters',
      })
      expect(mockSyncTeamWithStripe).not.toHaveBeenCalled()
    })

    it('should handle Missing required parameters error from service', async () => {
      const mockBody = {
        userEmail: 'user@example.com',
        firebaseUid: 'firebase-uid-123',
        teamId: 'team123',
      }

      mockSyncTeamWithStripe.mockRejectedValue(
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
        userEmail: 'user@example.com',
        firebaseUid: 'firebase-uid-123',
        teamId: 'team123',
      }

      mockSyncTeamWithStripe.mockRejectedValue(
        new Error('Stripe service error'),
      )

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Failed to sync team with Stripe',
      })
    })

    it('should handle unknown errors', async () => {
      const mockBody = {
        userEmail: 'user@example.com',
        firebaseUid: 'firebase-uid-123',
        teamId: 'team123',
      }

      mockSyncTeamWithStripe.mockRejectedValue('Unknown error')

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        error: 'Failed to sync team with Stripe',
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
        error: 'Failed to sync team with Stripe',
      })
    })
  })
})
