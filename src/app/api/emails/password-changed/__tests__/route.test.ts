import * as resendService from '@/services/resend-service'

import { POST } from '../route'

// Mock the Resend service
jest.mock('@/services/resend-service', () => ({
  createResendService: jest.fn(),
  handleResendError: jest.fn(),
}))

const mockCreateResendService = jest.mocked(resendService.createResendService)
const mockHandleResendError = jest.mocked(resendService.handleResendError)

describe('/api/emails/password-changed', () => {
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
      displayName: 'John Doe',
    }

    it('should send password changed email successfully', async () => {
      const mockEmailResponse = { id: 'email-123' }
      mockResendService.sendEmail.mockResolvedValue(mockEmailResponse)

      const request = createMockRequest(validRequestBody)
      const response = await POST(request)

      expect(mockCreateResendService).toHaveBeenCalled()
      expect(mockResendService.sendEmail).toHaveBeenCalledWith({
        from: 'TimeWise Tracker <noreply@papotte.dev>',
        to: ['test@example.com'],
        subject: 'Your password was changed',
        html: expect.stringContaining('Hello John Doe'),
      })

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(mockEmailResponse)
    })

    it('should handle missing displayName gracefully', async () => {
      const mockEmailResponse = { id: 'email-123' }
      mockResendService.sendEmail.mockResolvedValue(mockEmailResponse)

      const requestBody = {
        to: 'test@example.com',
      }

      const request = createMockRequest(requestBody)
      const response = await POST(request)

      expect(mockResendService.sendEmail).toHaveBeenCalledWith({
        from: 'TimeWise Tracker <noreply@papotte.dev>',
        to: ['test@example.com'],
        subject: 'Your password was changed',
        html: expect.stringContaining('Hello there'),
      })

      expect(response.status).toBe(200)
    })

    it('should handle null displayName gracefully', async () => {
      const mockEmailResponse = { id: 'email-123' }
      mockResendService.sendEmail.mockResolvedValue(mockEmailResponse)

      const requestBody = {
        to: 'test@example.com',
        displayName: null,
      }

      const request = createMockRequest(requestBody)
      const response = await POST(request)

      expect(mockResendService.sendEmail).toHaveBeenCalledWith({
        from: 'TimeWise Tracker <noreply@papotte.dev>',
        to: ['test@example.com'],
        subject: 'Your password was changed',
        html: expect.stringContaining('Hello there'),
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
        subject: 'Your password was changed',
        html: expect.stringContaining('Hello John Doe'),
      })

      expect(response.status).toBe(200)
    })

    it('should return 400 when to is missing', async () => {
      const requestBody = {
        displayName: 'John Doe',
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

    it('should return 400 when to is empty string', async () => {
      const requestBody = {
        to: '',
        displayName: 'John Doe',
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

    it('should generate correct HTML content with displayName', async () => {
      const mockEmailResponse = { id: 'email-123' }
      mockResendService.sendEmail.mockResolvedValue(mockEmailResponse)

      const request = createMockRequest(validRequestBody)
      await POST(request)

      const sendEmailCall = mockResendService.sendEmail.mock.calls[0][0]
      expect(sendEmailCall.html).toContain('Hello John Doe')
      expect(sendEmailCall.html).toContain('Password Changed')
      expect(sendEmailCall.html).toContain(
        'This is a confirmation that your password has been changed',
      )
      expect(sendEmailCall.html).toContain(
        'If you did not make this change, please contact support immediately',
      )
    })

    it('should generate correct HTML content without displayName', async () => {
      const mockEmailResponse = { id: 'email-123' }
      mockResendService.sendEmail.mockResolvedValue(mockEmailResponse)

      const requestBody = { to: 'test@example.com' }
      const request = createMockRequest(requestBody)
      await POST(request)

      const sendEmailCall = mockResendService.sendEmail.mock.calls[0][0]
      expect(sendEmailCall.html).toContain('Hello there')
      expect(sendEmailCall.html).toContain('Password Changed')
      expect(sendEmailCall.html).toContain(
        'This is a confirmation that your password has been changed',
      )
      expect(sendEmailCall.html).toContain(
        'If you did not make this change, please contact support immediately',
      )
    })

    it('should include proper HTML styling', async () => {
      const mockEmailResponse = { id: 'email-123' }
      mockResendService.sendEmail.mockResolvedValue(mockEmailResponse)

      const request = createMockRequest(validRequestBody)
      await POST(request)

      const sendEmailCall = mockResendService.sendEmail.mock.calls[0][0]
      expect(sendEmailCall.html).toContain('font-family: Arial, sans-serif')
      expect(sendEmailCall.html).toContain('line-height: 1.6')
    })
  })
})
