import type { TeamInvitation } from '@/lib/types'

import { sendTeamInvitationEmail } from '../email-notification-service.firestore'

// Mock fetch for Resend API calls
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// Mock console methods to avoid test noise
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation()
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()

describe('Email Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default successful fetch mock
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'resend-email-id' }),
    } as Response)
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

    it('should successfully send team invitation email via Resend API', async () => {
      await expect(
        sendTeamInvitationEmail(mockInvitation, 'Test Team', 'John Doe', 'en'),
      ).resolves.not.toThrow()

      // Verify Resend API was called with correct parameters
      expect(mockFetch).toHaveBeenCalledWith('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-resend-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'TimeWise Tracker <noreply@papotte.dev>',
          to: ['test@example.com'],
          subject: 'Invitation to join team "Test Team"',
          html: expect.stringContaining('John Doe has invited you'),
          text: expect.stringContaining('John Doe has invited you'),
        }),
      })

      // Verify logging
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        'Sending invitation email directly to test@example.com',
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
        'Email sent successfully via Resend API',
        {
          invitationId: 'test-invitation-id',
          email: 'test@example.com',
          resendId: 'resend-email-id',
        }
      )
    })

    it('should handle Resend API errors and re-throw them', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid API key' }),
      } as Response)

      await expect(
        sendTeamInvitationEmail(mockInvitation, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Resend API error: 400 Bad Request')

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

      // Should not call Resend API for invalid environment
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error when invitation email is missing', async () => {
      const invalidInvitation = { ...mockInvitation, email: '' }

      await expect(
        sendTeamInvitationEmail(invalidInvitation, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Invitation email is required')

      // Should not call Resend API for invalid input
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error when team ID is missing', async () => {
      const invalidInvitation = { ...mockInvitation, teamId: '' }

      await expect(
        sendTeamInvitationEmail(invalidInvitation, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Team ID and invitation ID are required')

      // Should not call Resend API for invalid input
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should throw error when invitation ID is missing', async () => {
      const invalidInvitation = { ...mockInvitation, id: '' }

      await expect(
        sendTeamInvitationEmail(invalidInvitation, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Team ID and invitation ID are required')

      // Should not call Resend API for invalid input
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should use default language when not specified', async () => {
      await sendTeamInvitationEmail(mockInvitation, 'Test Team', 'John Doe')

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        'Sending invitation email directly to test@example.com',
        expect.objectContaining({
          language: 'en',
        }),
      )
    })

    it('should handle admin role invitations', async () => {
      const adminInvitation = { ...mockInvitation, role: 'admin' as const }

      await sendTeamInvitationEmail(adminInvitation, 'Test Team', 'John Doe')

      expect(mockFetch).toHaveBeenCalledWith('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-resend-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'TimeWise Tracker <noreply@papotte.dev>',
          to: ['test@example.com'],
          subject: 'Invitation to join team "Test Team"',
          html: expect.stringContaining('as a <strong>admin</strong>'),
          text: expect.stringContaining('as a admin'),
        }),
      })

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        'Sending invitation email directly to test@example.com',
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
        'Sending invitation email directly to test@example.com',
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

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error')
      mockFetch.mockRejectedValue(networkError)

      await expect(
        sendTeamInvitationEmail(mockInvitation, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Network error')

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to send invitation email:',
        networkError
      )
    })
  })
})
