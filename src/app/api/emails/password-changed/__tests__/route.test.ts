import { cookies } from 'next/headers'

import * as emailTranslations from '@/lib/email-translations'
import * as resendService from '@/services/resend-service'

import { POST } from '../route'

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue(undefined),
  }),
}))

// Mock email translations
jest.mock('@/lib/email-translations', () => ({
  getEmailTranslations: jest.fn().mockResolvedValue({
    teamInvitation: {
      subject: 'Invitation to join team "{teamName}"',
      heading: 'Team Invitation',
      body: '{inviterName} has invited you to join the team "{teamName}" as a {role}.',
      acceptButton: 'Accept or Decline Invitation',
      expiry: 'Important: This invitation will expire in 7 days.',
      ignore:
        'If you did not expect this invitation, you can safely ignore this email.',
    },
    passwordChanged: {
      subject: 'Your password was changed',
      heading: 'Password Changed',
      greeting: 'Hello {displayName},',
      greetingFallback: 'Hello there,',
      body: 'This is a confirmation that your password has been changed.',
      warning:
        'If you did not make this change, please contact support immediately.',
    },
  }),
}))

// Mock the Resend service
jest.mock('@/services/resend-service', () => ({
  createResendService: jest.fn(),
  handleResendError: jest.fn(),
}))

const mockCookies = jest.mocked(cookies)
const mockGetEmailTranslations = jest.mocked(
  emailTranslations.getEmailTranslations,
)
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

  describe('locale-based email content', () => {
    const validRequestBody = {
      to: 'test@example.com',
      displayName: 'John Doe',
    }

    it('should call getEmailTranslations with the locale from the cookie', async () => {
      mockCookies.mockResolvedValueOnce({
        get: jest.fn().mockReturnValue({ value: 'es' }),
      } as never)
      mockResendService.sendEmail.mockResolvedValue({ id: 'email-123' })

      const request = createMockRequest(validRequestBody)
      await POST(request)

      expect(mockGetEmailTranslations).toHaveBeenCalledWith('es')
    })

    it('should call getEmailTranslations with undefined when no locale cookie is set', async () => {
      mockCookies.mockResolvedValueOnce({
        get: jest.fn().mockReturnValue(undefined),
      } as never)
      mockResendService.sendEmail.mockResolvedValue({ id: 'email-123' })

      const request = createMockRequest(validRequestBody)
      await POST(request)

      expect(mockGetEmailTranslations).toHaveBeenCalledWith(undefined)
    })

    it('should send Spanish password changed email when locale is es', async () => {
      mockCookies.mockResolvedValueOnce({
        get: jest.fn().mockReturnValue({ value: 'es' }),
      } as never)
      mockGetEmailTranslations.mockResolvedValueOnce({
        teamInvitation: {
          subject: 'Invitación para unirse al equipo "{teamName}"',
          heading: 'Invitación de equipo',
          body: '{inviterName} te ha invitado a unirte al equipo "{teamName}" como {role}.',
          acceptButton: 'Aceptar o rechazar invitación',
          expiry: 'Importante: Esta invitación expirará en 7 días.',
          ignore:
            'Si no esperabas esta invitación, puedes ignorar este correo electrónico de forma segura.',
        },
        passwordChanged: {
          subject: 'Tu contraseña fue cambiada',
          heading: 'Contraseña cambiada',
          greeting: 'Hola {displayName},',
          greetingFallback: 'Hola,',
          body: 'Esto es una confirmación de que tu contraseña ha sido cambiada.',
          warning:
            'Si no realizaste este cambio, por favor contacta al soporte inmediatamente.',
        },
      })
      mockResendService.sendEmail.mockResolvedValue({ id: 'email-123' })

      const request = createMockRequest(validRequestBody)
      const response = await POST(request)

      expect(response.status).toBe(200)
      const sendEmailCall = mockResendService.sendEmail.mock.calls[0][0]
      expect(sendEmailCall.subject).toBe('Tu contraseña fue cambiada')
      expect(sendEmailCall.html).toContain('Contraseña cambiada')
      expect(sendEmailCall.html).toContain('Hola John Doe')
      expect(sendEmailCall.html).toContain(
        'Esto es una confirmación de que tu contraseña ha sido cambiada.',
      )
      expect(sendEmailCall.html).toContain(
        'Si no realizaste este cambio, por favor contacta al soporte inmediatamente.',
      )
    })

    it('should send German password changed email when locale is de', async () => {
      mockCookies.mockResolvedValueOnce({
        get: jest.fn().mockReturnValue({ value: 'de' }),
      } as never)
      mockGetEmailTranslations.mockResolvedValueOnce({
        teamInvitation: {
          subject: 'Einladung zum Team "{teamName}"',
          heading: 'Team-Einladung',
          body: '{inviterName} hat Sie eingeladen, dem Team "{teamName}" als {role} beizutreten.',
          acceptButton: 'Einladung annehmen oder ablehnen',
          expiry: 'Wichtig: Diese Einladung läuft in 7 Tagen ab.',
          ignore:
            'Falls Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.',
        },
        passwordChanged: {
          subject: 'Ihr Passwort wurde geändert',
          heading: 'Passwort geändert',
          greeting: 'Hallo {displayName},',
          greetingFallback: 'Hallo,',
          body: 'Dies ist eine Bestätigung, dass Ihr Passwort geändert wurde.',
          warning:
            'Falls Sie diese Änderung nicht vorgenommen haben, kontaktieren Sie bitte sofort den Support.',
        },
      })
      mockResendService.sendEmail.mockResolvedValue({ id: 'email-123' })

      const request = createMockRequest(validRequestBody)
      const response = await POST(request)

      expect(response.status).toBe(200)
      const sendEmailCall = mockResendService.sendEmail.mock.calls[0][0]
      expect(sendEmailCall.subject).toBe('Ihr Passwort wurde geändert')
      expect(sendEmailCall.html).toContain('Passwort geändert')
      expect(sendEmailCall.html).toContain('Hallo John Doe')
      expect(sendEmailCall.html).toContain(
        'Dies ist eine Bestätigung, dass Ihr Passwort geändert wurde.',
      )
      expect(sendEmailCall.html).toContain(
        'Falls Sie diese Änderung nicht vorgenommen haben, kontaktieren Sie bitte sofort den Support.',
      )
    })

    it('should use fallback greeting when displayName is absent (Spanish)', async () => {
      mockCookies.mockResolvedValueOnce({
        get: jest.fn().mockReturnValue({ value: 'es' }),
      } as never)
      mockGetEmailTranslations.mockResolvedValueOnce({
        teamInvitation: {
          subject: 'Invitación para unirse al equipo "{teamName}"',
          heading: 'Invitación de equipo',
          body: '{inviterName} te ha invitado a unirte al equipo "{teamName}" como {role}.',
          acceptButton: 'Aceptar o rechazar invitación',
          expiry: 'Importante: Esta invitación expirará en 7 días.',
          ignore:
            'Si no esperabas esta invitación, puedes ignorar este correo electrónico de forma segura.',
        },
        passwordChanged: {
          subject: 'Tu contraseña fue cambiada',
          heading: 'Contraseña cambiada',
          greeting: 'Hola {displayName},',
          greetingFallback: 'Hola,',
          body: 'Esto es una confirmación de que tu contraseña ha sido cambiada.',
          warning:
            'Si no realizaste este cambio, por favor contacta al soporte inmediatamente.',
        },
      })
      mockResendService.sendEmail.mockResolvedValue({ id: 'email-123' })

      const request = createMockRequest({ to: 'test@example.com' })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const sendEmailCall = mockResendService.sendEmail.mock.calls[0][0]
      expect(sendEmailCall.html).toContain('Hola,')
      expect(sendEmailCall.html).not.toContain('{displayName}')
    })

    it('should send English password changed email by default when no locale cookie', async () => {
      mockCookies.mockResolvedValueOnce({
        get: jest.fn().mockReturnValue(undefined),
      } as never)
      mockResendService.sendEmail.mockResolvedValue({ id: 'email-123' })

      const request = createMockRequest(validRequestBody)
      const response = await POST(request)

      expect(response.status).toBe(200)
      const sendEmailCall = mockResendService.sendEmail.mock.calls[0][0]
      expect(sendEmailCall.subject).toBe('Your password was changed')
      expect(sendEmailCall.html).toContain('Password Changed')
      expect(sendEmailCall.html).toContain('Hello John Doe')
    })
  })
})
