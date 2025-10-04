import { NextRequest } from 'next/server'

import {
  createResendService,
  handleResendError,
} from '@/services/resend-service'

import { POST } from '../route'

// Mock the Resend service
jest.mock('@/services/resend-service', () => ({
  createResendService: jest.fn(() => ({
    createContact: jest.fn(),
  })),
  handleResendError: jest.fn((error) => ({
    message: error.message || 'Unknown error',
    status: 400,
  })),
  RESEND_AUDIENCE_ID: 'b99a5561-f0df-4730-9988-1704e4fcfda1',
}))

describe('/api/contacts/add', () => {
  let mockCreateContact: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateContact = jest.fn()
    ;(createResendService as jest.Mock).mockReturnValue({
      createContact: mockCreateContact,
    })
  })

  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest
  }

  describe('POST', () => {
    it('should add contact successfully', async () => {
      const mockBody = {
        email: 'test@example.com',
      }

      const mockResult = {
        id: 'contact-123',
        email: 'test@example.com',
      }

      mockCreateContact.mockResolvedValue(mockResult)

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(mockCreateContact).toHaveBeenCalledWith({
        email: 'test@example.com',
        audienceId: 'b99a5561-f0df-4730-9988-1704e4fcfda1',
      })

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(mockResult)
    })

    it('should return 400 when email is missing', async () => {
      const mockBody = {}

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Missing required fields',
      })
      expect(mockCreateContact).not.toHaveBeenCalled()
    })

    it('should return 500 when RESEND_API_KEY is not configured', async () => {
      ;(createResendService as jest.Mock).mockImplementation(() => {
        throw new Error('RESEND_API_KEY is not configured')
      })
      ;(handleResendError as jest.Mock).mockReturnValue({
        message: 'RESEND_API_KEY is not configured',
        status: 500,
      })

      const mockBody = {
        email: 'test@example.com',
      }

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'RESEND_API_KEY is not configured',
      })
    })

    it('should handle Resend API errors', async () => {
      const mockBody = {
        email: 'test@example.com',
      }

      const mockError = new Error('Email already exists')
      mockCreateContact.mockRejectedValue(mockError)
      ;(handleResendError as jest.Mock).mockReturnValue({
        message: 'Email already exists',
        status: 400,
      })

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Email already exists',
      })
    })

    it('should handle unexpected errors', async () => {
      const mockBody = {
        email: 'test@example.com',
      }

      mockCreateContact.mockRejectedValue(new Error('Network error'))
      ;(handleResendError as jest.Mock).mockReturnValue({
        message: 'Network error',
        status: 500,
      })

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Network error',
      })
    })

    it('should handle JSON parsing errors', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest

      ;(handleResendError as jest.Mock).mockReturnValue({
        message: 'Unexpected error',
        status: 500,
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Unexpected error',
      })
    })
  })
})
