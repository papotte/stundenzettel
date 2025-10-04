import * as resendService from '@/services/resend-service'

import { POST } from '../route'

// Mock the Resend service
jest.mock('@/services/resend-service', () => ({
  createResendService: jest.fn(),
  handleResendError: jest.fn(),
}))

const mockCreateResendService = jest.mocked(resendService.createResendService)
const mockHandleResendError = jest.mocked(resendService.handleResendError)

describe('/api/emails/team-invitation', () => {
  const mockResendService = {
    sendEmail: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateResendService.mockReturnValue(mockResendService as never)
  })

  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as Request
  }

  describe('POST', () => {
    const validRequestBody = {
      to: 'test@example.com',
      teamName: 'Test Team',
      inviterName: 'John Doe',
      invitationLink: 'https://example.com/invitation/123',
      role: 'member',
    }

    it('should send team invitation email successfully', async () => {
      const mockEmailResponse = { id: 'email-123' }
      mockResendService.sendEmail.mockResolvedValue(mockEmailResponse)

      const request = createMockRequest(validRequestBody)
      const response = await POST(request)

      expect(mockCreateResendService).toHaveBeenCalled()
      expect(mockResendService.sendEmail).toHaveBeenCalledWith({
        from: 'TimeWise Tracker <noreply@papotte.dev>',
        to: ['test@example.com'],
        subject: 'Invitation to join team "Test Team"',
        react: expect.any(Object),
      })

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(mockEmailResponse)
    })

    it('should use custom subject when provided', async () => {
      const mockEmailResponse = { id: 'email-123' }
      mockResendService.sendEmail.mockResolvedValue(mockEmailResponse)

      const requestBody = {
        ...validRequestBody,
        subject: 'Custom invitation subject',
      }

      const request = createMockRequest(requestBody)
      const response = await POST(request)

      expect(mockResendService.sendEmail).toHaveBeenCalledWith({
        from: 'TimeWise Tracker <noreply@papotte.dev>',
        to: ['test@example.com'],
        subject: 'Custom invitation subject',
        react: expect.any(Object),
      })

      expect(response.status).toBe(200)
    })

    it('should use custom from address when provided', async () => {
      const mockEmailResponse = { id: 'email-123' }
      mockResendService.sendEmail.mockResolvedValue(mockEmailResponse)

      const requestBody = {
        ...validRequestBody,
        from: 'Custom Sender <custom@example.com>',
      }

      const request = createMockRequest(requestBody)
      const response = await POST(request)

      expect(mockResendService.sendEmail).toHaveBeenCalledWith({
        from: 'Custom Sender <custom@example.com>',
        to: ['test@example.com'],
        subject: 'Invitation to join team "Test Team"',
        react: expect.any(Object),
      })

      expect(response.status).toBe(200)
    })

    it('should return 400 when to is missing', async () => {
      const requestBody = {
        teamName: 'Test Team',
        inviterName: 'John Doe',
        invitationLink: 'https://example.com/invitation/123',
        role: 'member',
      }

      const request = createMockRequest(requestBody)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Missing required fields',
      })
      expect(mockResendService.sendEmail).not.toHaveBeenCalled()
    })

    it('should return 400 when teamName is missing', async () => {
      const requestBody = {
        to: 'test@example.com',
        inviterName: 'John Doe',
        invitationLink: 'https://example.com/invitation/123',
        role: 'member',
      }

      const request = createMockRequest(requestBody)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Missing required fields',
      })
      expect(mockResendService.sendEmail).not.toHaveBeenCalled()
    })

    it('should return 400 when inviterName is missing', async () => {
      const requestBody = {
        to: 'test@example.com',
        teamName: 'Test Team',
        invitationLink: 'https://example.com/invitation/123',
        role: 'member',
      }

      const request = createMockRequest(requestBody)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Missing required fields',
      })
      expect(mockResendService.sendEmail).not.toHaveBeenCalled()
    })

    it('should return 400 when invitationLink is missing', async () => {
      const requestBody = {
        to: 'test@example.com',
        teamName: 'Test Team',
        inviterName: 'John Doe',
        role: 'member',
      }

      const request = createMockRequest(requestBody)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Missing required fields',
      })
      expect(mockResendService.sendEmail).not.toHaveBeenCalled()
    })

    it('should return 400 when role is missing', async () => {
      const requestBody = {
        to: 'test@example.com',
        teamName: 'Test Team',
        inviterName: 'John Doe',
        invitationLink: 'https://example.com/invitation/123',
      }

      const request = createMockRequest(requestBody)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Missing required fields',
      })
      expect(mockResendService.sendEmail).not.toHaveBeenCalled()
    })

    it('should handle resend service errors', async () => {
      const resendError = new Error('Resend API error')
      mockResendService.sendEmail.mockRejectedValue(resendError)
      mockHandleResendError.mockReturnValue({
        message: 'Resend API error',
        status: 400,
      })

      const request = createMockRequest(validRequestBody)
      const response = await POST(request)

      expect(mockHandleResendError).toHaveBeenCalledWith(resendError)
      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Resend API error',
      })
    })

    it('should handle JSON parsing errors', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as Request

      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Resend API error',
      })
    })

    it('should handle unknown errors', async () => {
      const unknownError = 'Unknown error'
      mockResendService.sendEmail.mockRejectedValue(unknownError)
      mockHandleResendError.mockReturnValue({
        message: 'Unexpected error',
        status: 500,
      })

      const request = createMockRequest(validRequestBody)
      const response = await POST(request)

      expect(mockHandleResendError).toHaveBeenCalledWith(unknownError)
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Unexpected error',
      })
    })

    it('should handle different role types', async () => {
      const mockEmailResponse = { id: 'email-123' }
      mockResendService.sendEmail.mockResolvedValue(mockEmailResponse)

      const adminRequestBody = {
        ...validRequestBody,
        role: 'admin',
      }

      const request = createMockRequest(adminRequestBody)
      const response = await POST(request)

      expect(mockResendService.sendEmail).toHaveBeenCalledWith({
        from: 'TimeWise Tracker <noreply@papotte.dev>',
        to: ['test@example.com'],
        subject: 'Invitation to join team "Test Team"',
        react: expect.any(Object),
      })

      expect(response.status).toBe(200)
    })

    it('should handle empty string values as missing fields', async () => {
      const requestBody = {
        to: '',
        teamName: 'Test Team',
        inviterName: 'John Doe',
        invitationLink: 'https://example.com/invitation/123',
        role: 'member',
      }

      const request = createMockRequest(requestBody)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        message: 'Missing required fields',
      })
      expect(mockResendService.sendEmail).not.toHaveBeenCalled()
    })
  })
})
