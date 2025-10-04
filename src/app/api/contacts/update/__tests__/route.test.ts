import { NextRequest } from 'next/server'

import {
  createResendService,
  handleResendError,
} from '@/services/resend-service'

import { PUT } from '../route'

// Mock the Resend service
jest.mock('@/services/resend-service', () => ({
  createResendService: jest.fn(() => ({
    updateContact: jest.fn(),
  })),
  handleResendError: jest.fn((error) => ({
    message: error.message || 'Unknown error',
    status: 400,
  })),
}))

describe('/api/contacts/update', () => {
  let mockUpdateContact: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdateContact = jest.fn()
    ;(createResendService as jest.Mock).mockReturnValue({
      updateContact: mockUpdateContact,
    })
  })

  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest
  }

  describe('PUT', () => {
    it('should update contact successfully with all fields', async () => {
      const mockBody = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        unsubscribed: false,
      }

      const mockResult = {
        id: 'contact-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        unsubscribed: false,
      }

      mockUpdateContact.mockResolvedValue(mockResult)

      const request = createMockRequest(mockBody)
      const response = await PUT(request)

      expect(mockUpdateContact).toHaveBeenCalledWith('test@example.com', {
        firstName: 'John',
        lastName: 'Doe',
        unsubscribed: false,
      })

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(mockResult)
    })

    it('should update contact successfully with partial fields', async () => {
      const mockBody = {
        email: 'test@example.com',
        firstName: 'Jane',
      }

      const mockResult = {
        id: 'contact-123',
        email: 'test@example.com',
        firstName: 'Jane',
      }

      mockUpdateContact.mockResolvedValue(mockResult)

      const request = createMockRequest(mockBody)
      const response = await PUT(request)

      expect(mockUpdateContact).toHaveBeenCalledWith('test@example.com', {
        firstName: 'Jane',
        lastName: undefined,
        unsubscribed: undefined,
      })

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(mockResult)
    })

    it('should update contact with only email and unsubscribed', async () => {
      const mockBody = {
        email: 'test@example.com',
        unsubscribed: true,
      }

      const mockResult = {
        id: 'contact-123',
        email: 'test@example.com',
        unsubscribed: true,
      }

      mockUpdateContact.mockResolvedValue(mockResult)

      const request = createMockRequest(mockBody)
      const response = await PUT(request)

      expect(mockUpdateContact).toHaveBeenCalledWith('test@example.com', {
        firstName: undefined,
        lastName: undefined,
        unsubscribed: true,
      })

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(mockResult)
    })

    it('should return 400 when email is missing', async () => {
      const mockBody = {
        firstName: 'John',
        lastName: 'Doe',
      }

      const request = createMockRequest(mockBody)
      const response = await PUT(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Missing required field: email',
      })
      expect(mockUpdateContact).not.toHaveBeenCalled()
    })

    it('should return 400 when email is empty string', async () => {
      const mockBody = {
        email: '',
        firstName: 'John',
      }

      const request = createMockRequest(mockBody)
      const response = await PUT(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Missing required field: email',
      })
      expect(mockUpdateContact).not.toHaveBeenCalled()
    })

    it('should return 400 when email is null', async () => {
      const mockBody = {
        email: null,
        firstName: 'John',
      }

      const request = createMockRequest(mockBody)
      const response = await PUT(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Missing required field: email',
      })
      expect(mockUpdateContact).not.toHaveBeenCalled()
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
        firstName: 'John',
      }

      const request = createMockRequest(mockBody)
      const response = await PUT(request)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'RESEND_API_KEY is not configured',
      })
    })

    it('should handle Resend service errors', async () => {
      const mockBody = {
        email: 'test@example.com',
        firstName: 'John',
      }

      const mockError = new Error('Contact not found')
      mockUpdateContact.mockRejectedValue(mockError)
      ;(handleResendError as jest.Mock).mockReturnValue({
        message: 'Contact not found',
        status: 400,
      })

      const request = createMockRequest(mockBody)
      const response = await PUT(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Contact not found',
      })
    })

    it('should handle unexpected errors', async () => {
      const mockBody = {
        email: 'test@example.com',
        firstName: 'John',
      }

      mockUpdateContact.mockRejectedValue(new Error('Network error'))
      ;(handleResendError as jest.Mock).mockReturnValue({
        message: 'Network error',
        status: 500,
      })

      const request = createMockRequest(mockBody)
      const response = await PUT(request)

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

      const response = await PUT(request)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Unexpected error',
      })
    })

    it('should handle empty request body', async () => {
      const mockBody = {}

      const request = createMockRequest(mockBody)
      const response = await PUT(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Missing required field: email',
      })
      expect(mockUpdateContact).not.toHaveBeenCalled()
    })

    it('should handle undefined values in request body', async () => {
      const mockBody = {
        email: 'test@example.com',
        firstName: undefined,
        lastName: undefined,
        unsubscribed: undefined,
      }

      const mockResult = {
        id: 'contact-123',
        email: 'test@example.com',
      }

      mockUpdateContact.mockResolvedValue(mockResult)

      const request = createMockRequest(mockBody)
      const response = await PUT(request)

      expect(mockUpdateContact).toHaveBeenCalledWith('test@example.com', {
        firstName: undefined,
        lastName: undefined,
        unsubscribed: undefined,
      })

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(mockResult)
    })

    it('should handle boolean unsubscribed field correctly', async () => {
      const mockBody = {
        email: 'test@example.com',
        unsubscribed: false,
      }

      const mockResult = {
        id: 'contact-123',
        email: 'test@example.com',
        unsubscribed: false,
      }

      mockUpdateContact.mockResolvedValue(mockResult)

      const request = createMockRequest(mockBody)
      const response = await PUT(request)

      expect(mockUpdateContact).toHaveBeenCalledWith('test@example.com', {
        firstName: undefined,
        lastName: undefined,
        unsubscribed: false,
      })

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(mockResult)
    })
  })
})
