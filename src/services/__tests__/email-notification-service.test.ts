import type { TeamInvitation } from '@/lib/types'

import { sendTeamInvitationEmail } from '../email-notification-service.firestore'

// Mock Resend library
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}))

// Import the mocked Resend class
import { Resend } from 'resend'

// Mock console methods to avoid test noise
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation()
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()

describe('Email Notification Service', () => {
  // Get the mocked Resend constructor
  const MockedResend = Resend as jest.MockedClass<typeof Resend>
  let mockEmailsSend: jest.MockedFunction<any>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Create a fresh mock for emails.send
    mockEmailsSend = jest.fn()
    MockedResend.mockImplementation(() => ({
      emails: {
        send: mockEmailsSend,
      },
    } as any))

    // Default successful response
    mockEmailsSend.mockResolvedValue({
      data: { id: 'resend-email-id' },
      error: null,
    })
  })

  afterAll(() => {
    mockConsoleInfo.mockRestore()
    mockConsoleError.mockRestore()
  })

  describe('sendTeamInvitationEmail', () => {
    const mockInvitation: TeamInvitation = {
      id: 'test-invitation-id',
      teamId: 'test-team-id',
      email: 'test@example.com',
      role: 'member',
      invitedBy: 'inviter-id',
      invitedAt: new Date('2024-01-01'),
      expiresAt: new Date('2024-01-08'),
      status: 'pending',
    }

    // Mock environment variable
    const originalEnv = process.env.NEXT_PUBLIC_RESEND_API_KEY

    beforeEach(() => {
      process.env.NEXT_PUBLIC_RESEND_API_KEY = 'test-resend-key'
    })

    afterEach(() => {
      if (originalEnv) {
        process.env.NEXT_PUBLIC_RESEND_API_KEY = originalEnv
      } else {
        delete process.env.NEXT_PUBLIC_RESEND_API_KEY
      }
    })

    it('should successfully send team invitation email via Resend library', async () => {
      await expect(
        sendTeamInvitationEmail(mockInvitation, 'Test Team', 'John Doe', 'en'),
      ).resolves.not.toThrow()

      // Verify Resend was initialized with correct API key
      expect(MockedResend).toHaveBeenCalledWith('test-resend-key')

      // Verify Resend emails.send was called with correct parameters
      expect(mockEmailsSend).toHaveBeenCalledWith({
        from: 'TimeWise Tracker <noreply@papotte.dev>',
        to: ['test@example.com'],
        subject: 'Invitation to join team "Test Team"',
        html: expect.stringContaining('John Doe has invited you'),
        text: expect.stringContaining('John Doe has invited you'),
      })

      // Verify logging
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        'Sending invitation email using Resend library to test@example.com',
        expect.objectContaining({
          invitationId: 'test-invitation-id',
          teamId: 'test-team-id',
          teamName: 'Test Team',
          inviterName: 'John Doe',
          role: 'member',
          language: 'en',
          invitationLink: expect.stringContaining('/team/invitation/test-invitation-id'),
        }),
      )

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        'Email sent successfully via Resend library',
        {
          invitationId: 'test-invitation-id',
          email: 'test@example.com',
          resendId: 'resend-email-id',
        }
      )
    })

    it('should handle Resend API errors and re-throw them', async () => {
      mockEmailsSend.mockResolvedValue({
        data: null,
        error: { message: 'Invalid API key' },
      })

      await expect(
        sendTeamInvitationEmail(mockInvitation, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Resend API error: Invalid API key')

      // Verify error was logged
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to send invitation email:',
        expect.any(Error)
      )
    })

    it('should throw error when RESEND_API_KEY is missing', async () => {
      delete process.env.NEXT_PUBLIC_RESEND_API_KEY

      await expect(
        sendTeamInvitationEmail(mockInvitation, 'Test Team', 'John Doe'),
      ).rejects.toThrow('NEXT_PUBLIC_RESEND_API_KEY environment variable is not set')

      // Should not initialize Resend for invalid environment
      expect(MockedResend).not.toHaveBeenCalled()
    })

    it('should throw error when invitation email is missing', async () => {
      const invalidInvitation = { ...mockInvitation, email: '' }

      await expect(
        sendTeamInvitationEmail(invalidInvitation, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Invitation email is required')

      // Should not initialize Resend for invalid input
      expect(MockedResend).not.toHaveBeenCalled()
    })

    it('should throw error when team ID is missing', async () => {
      const invalidInvitation = { ...mockInvitation, teamId: '' }

      await expect(
        sendTeamInvitationEmail(invalidInvitation, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Team ID and invitation ID are required')

      // Should not initialize Resend for invalid input
      expect(MockedResend).not.toHaveBeenCalled()
    })

    it('should throw error when invitation ID is missing', async () => {
      const invalidInvitation = { ...mockInvitation, id: '' }

      await expect(
        sendTeamInvitationEmail(invalidInvitation, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Team ID and invitation ID are required')

      // Should not initialize Resend for invalid input
      expect(MockedResend).not.toHaveBeenCalled()
    })

    it('should use default language when not specified', async () => {
      await sendTeamInvitationEmail(mockInvitation, 'Test Team', 'John Doe')

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        'Sending invitation email using Resend library to test@example.com',
        expect.objectContaining({
          language: 'en',
        }),
      )
    })

    it('should handle admin role invitations', async () => {
      const adminInvitation = { ...mockInvitation, role: 'admin' as const }

      await sendTeamInvitationEmail(adminInvitation, 'Test Team', 'John Doe')

      expect(mockEmailsSend).toHaveBeenCalledWith({
        from: 'TimeWise Tracker <noreply@papotte.dev>',
        to: ['test@example.com'],
        subject: 'Invitation to join team "Test Team"',
        html: expect.stringContaining('as a <strong>admin</strong>'),
        text: expect.stringContaining('as a admin'),
      })

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        'Sending invitation email using Resend library to test@example.com',
        expect.objectContaining({
          role: 'admin',
        }),
      )
    })

    it('should include correct invitation link with environment URL', async () => {
      const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL
      process.env.NEXT_PUBLIC_APP_URL = 'https://timewise.example.com'

      await sendTeamInvitationEmail(mockInvitation, 'Test Team', 'John Doe')

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        'Sending invitation email using Resend library to test@example.com',
        expect.objectContaining({
          invitationLink: 'https://timewise.example.com/team/invitation/test-invitation-id',
        }),
      )

      // Restore original environment
      if (originalAppUrl) {
        process.env.NEXT_PUBLIC_APP_URL = originalAppUrl
      } else {
        delete process.env.NEXT_PUBLIC_APP_URL
      }
    })

    it('should handle Resend library exceptions gracefully', async () => {
      const resendError = new Error('Network error')
      mockEmailsSend.mockRejectedValue(resendError)

      await expect(
        sendTeamInvitationEmail(mockInvitation, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Network error')

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to send invitation email:',
        resendError
      )
    })
  })
})
