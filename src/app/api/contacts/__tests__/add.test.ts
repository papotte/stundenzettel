import { NextRequest } from 'next/server'
import { Resend } from 'resend'

import { POST } from '../add/route'

// Mock the Resend module
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      contacts: {
        create: jest.fn(),
      },
    })),
  }
})

describe('/api/contacts/add', () => {
  let mockResendInstance: {
    contacts: {
      create: jest.Mock
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Get the mocked Resend instance
    mockResendInstance = new Resend('test-api-key') as unknown as {
      contacts: {
        create: jest.Mock
      }
    }
    // Set environment variables
    process.env.RESEND_API_KEY = 'test-api-key'
    process.env.RESEND_AUDIENCE_ID = 'test-audience-id'
  })

  afterEach(() => {
    delete process.env.RESEND_API_KEY
    delete process.env.RESEND_AUDIENCE_ID
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
        data: {
          id: 'contact-123',
          email: 'test@example.com',
        },
        error: null,
      }

      mockResendInstance.contacts.create.mockResolvedValue(mockResult)

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(mockResendInstance.contacts.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        audienceId: 'test-audience-id',
        tags: [
          {
            name: 'app',
            value: 'time tracker',
          },
        ],
      })

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(mockResult.data)
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
      expect(mockResendInstance.contacts.create).not.toHaveBeenCalled()
    })

    it('should return 500 when RESEND_API_KEY is not configured', async () => {
      delete process.env.RESEND_API_KEY

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

      const mockError = {
        name: 'validation_error',
        message: 'Email already exists',
      }

      mockResendInstance.contacts.create.mockResolvedValue({
        data: null,
        error: mockError,
      })

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual(mockError)
    })

    it('should handle unexpected errors', async () => {
      const mockBody = {
        email: 'test@example.com',
      }

      mockResendInstance.contacts.create.mockRejectedValue(
        new Error('Network error'),
      )

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Unexpected error',
      })
    })

    it('should handle JSON parsing errors', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest

      const response = await POST(request)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Unexpected error',
      })
    })

    it('should use empty string for audienceId when not configured', async () => {
      delete process.env.RESEND_AUDIENCE_ID

      const mockBody = {
        email: 'test@example.com',
      }

      const mockResult = {
        data: {
          id: 'contact-123',
          email: 'test@example.com',
        },
        error: null,
      }

      mockResendInstance.contacts.create.mockResolvedValue(mockResult)

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      expect(mockResendInstance.contacts.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        audienceId: '',
        tags: [
          {
            name: 'app',
            value: 'time tracker',
          },
        ],
      })

      expect(response.status).toBe(200)
    })

    it('should properly tag contacts with "app: time tracker"', async () => {
      const mockBody = {
        email: 'newuser@example.com',
      }

      const mockResult = {
        data: {
          id: 'contact-456',
          email: 'newuser@example.com',
          tags: [
            {
              name: 'app',
              value: 'time tracker',
            },
          ],
        },
        error: null,
      }

      mockResendInstance.contacts.create.mockResolvedValue(mockResult)

      const request = createMockRequest(mockBody)
      const response = await POST(request)

      const callArgs = mockResendInstance.contacts.create.mock.calls[0][0]
      expect(callArgs.tags).toEqual([
        {
          name: 'app',
          value: 'time tracker',
        },
      ])

      expect(response.status).toBe(200)
    })
  })
})
