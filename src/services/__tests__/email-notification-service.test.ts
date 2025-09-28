import type { TeamInvitation } from '@/lib/types'

import { sendTeamInvitationEmail } from '../email-notification-service.firestore'

// Mock console.info to avoid test noise
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation()

describe('Email Notification Service', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    mockConsoleInfo.mockRestore()
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

    it('should successfully send team invitation email with all required information', async () => {
      await expect(
        sendTeamInvitationEmail(mockInvitation, 'Test Team', 'John Doe', 'en'),
      ).resolves.not.toThrow()

      // Verify that the email information was logged
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        'Team invitation email would be sent to test@example.com',
        expect.objectContaining({
          invitationId: 'test-invitation-id',
          teamId: 'test-team-id',
          teamName: 'Test Team',
          inviterName: 'John Doe',
          role: 'member',
          language: 'en',
          invitationLink: expect.stringContaining(
            '/team/invitation/test-invitation-id',
          ),
          expiresAt: mockInvitation.expiresAt,
        }),
      )

      // Verify email content was logged
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        'Email content:',
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Invitation to join team "Test Team"',
          body: expect.stringContaining('John Doe has invited you'),
        }),
      )
    })

    it('should throw error when invitation email is missing', async () => {
      const invalidInvitation = { ...mockInvitation, email: '' }

      await expect(
        sendTeamInvitationEmail(invalidInvitation, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Invitation email is required')
    })

    it('should throw error when team ID is missing', async () => {
      const invalidInvitation = { ...mockInvitation, teamId: '' }

      await expect(
        sendTeamInvitationEmail(invalidInvitation, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Team ID and invitation ID are required')
    })

    it('should throw error when invitation ID is missing', async () => {
      const invalidInvitation = { ...mockInvitation, id: '' }

      await expect(
        sendTeamInvitationEmail(invalidInvitation, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Team ID and invitation ID are required')
    })

    it('should use default language when not specified', async () => {
      await sendTeamInvitationEmail(mockInvitation, 'Test Team', 'John Doe')

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        'Team invitation email would be sent to test@example.com',
        expect.objectContaining({
          language: 'en',
        }),
      )
    })

    it('should include correct invitation link with environment URL', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_APP_URL
      process.env.NEXT_PUBLIC_APP_URL = 'https://timewise.example.com'

      await sendTeamInvitationEmail(mockInvitation, 'Test Team', 'John Doe')

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        'Team invitation email would be sent to test@example.com',
        expect.objectContaining({
          invitationLink:
            'https://timewise.example.com/team/invitation/test-invitation-id',
        }),
      )

      // Restore original environment
      if (originalEnv) {
        process.env.NEXT_PUBLIC_APP_URL = originalEnv
      } else {
        delete process.env.NEXT_PUBLIC_APP_URL
      }
    })

    it('should handle admin role invitations', async () => {
      const adminInvitation = { ...mockInvitation, role: 'admin' as const }

      await sendTeamInvitationEmail(adminInvitation, 'Test Team', 'John Doe')

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        'Team invitation email would be sent to test@example.com',
        expect.objectContaining({
          role: 'admin',
        }),
      )
    })
  })
})
