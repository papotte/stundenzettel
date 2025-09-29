import type { TeamInvitation } from '@/lib/types'

import {
  sendPasswordChangeNotification,
  sendTeamInvitationEmail,
} from '../email-notification-service'

// Mock fetch for API calls
const originalFetch = global.fetch
const mockFetch = jest.fn()
beforeAll(() => {
  global.fetch = mockFetch
})
afterAll(() => {
  global.fetch = originalFetch
})

// Mock console methods to avoid test noise
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation()
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()

describe('Email Notification Service', () => {
  let responsePayload: unknown

  beforeEach(() => {
    jest.clearAllMocks()

    // Default successful fetch response
    responsePayload = { id: 'resend-email-id' }
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(responsePayload),
      text: () => Promise.resolve(JSON.stringify(responsePayload)),
    })
  })

  afterAll(() => {
    mockConsoleInfo.mockRestore()
    mockConsoleError.mockRestore()
  })

  describe('sendPasswordChangeNotification', () => {
    it('succeeds and calls the correct endpoint', async () => {
      await expect(
        sendPasswordChangeNotification('test@example.com', 'John Doe'),
      ).resolves.not.toThrow()

      expect(mockFetch).toHaveBeenCalledWith('/api/emails/password-changed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'test@example.com',
          displayName: 'John Doe',
        }),
      })
    })

    it('rethrows API error using parsed message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid API key' }),
      })

      await expect(
        sendPasswordChangeNotification('test@example.com', 'John Doe'),
      ).rejects.toThrow('Failed to send password change email: Invalid API key')
    })
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

    it('should successfully send team invitation email with various configurations', async () => {
      // Test basic invitation
      await expect(
        sendTeamInvitationEmail(mockInvitation, 'Test Team', 'John Doe'),
      ).resolves.not.toThrow()

      expect(mockFetch).toHaveBeenCalledWith('/api/emails/team-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"to":"test@example.com"'),
      })

      // Test admin role invitation
      const adminInvitation = { ...mockInvitation, role: 'admin' as const }
      await expect(
        sendTeamInvitationEmail(adminInvitation, 'Test Team', 'John Doe'),
      ).resolves.not.toThrow()

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should validate invitation data and throw appropriate errors', async () => {
      // Test missing email
      const invalidInvitation = { ...mockInvitation, email: '' }
      await expect(
        sendTeamInvitationEmail(invalidInvitation, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Invitation email is required')
      expect(mockFetch).not.toHaveBeenCalled()

      // Test missing team ID
      const invalidTeamId = { ...mockInvitation, teamId: '' }
      await expect(
        sendTeamInvitationEmail(invalidTeamId, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Team ID and invitation ID are required')
      expect(mockFetch).not.toHaveBeenCalled()

      // Test missing invitation ID
      const invalidInvitationId = { ...mockInvitation, id: '' }
      await expect(
        sendTeamInvitationEmail(invalidInvitationId, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Team ID and invitation ID are required')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle API errors and network exceptions', async () => {
      // Test API error response
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid API key' }),
      })

      await expect(
        sendTeamInvitationEmail(mockInvitation, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Failed to send team invitation email: Invalid API key')
    })

    it('should include correct invitation link with environment URL', async () => {
      const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL
      process.env.NEXT_PUBLIC_APP_URL = 'https://timewise.example.com'

      await sendTeamInvitationEmail(mockInvitation, 'Test Team', 'John Doe')
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/emails/team-invitation',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining(
            'https://timewise.example.com/team/invitation/test-invitation-id',
          ),
        }),
      )

      // Restore original environment
      if (originalAppUrl) {
        process.env.NEXT_PUBLIC_APP_URL = originalAppUrl
      } else {
        delete process.env.NEXT_PUBLIC_APP_URL
      }
    })
  })
})
