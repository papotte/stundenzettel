import { getFunctions, httpsCallable } from 'firebase/functions'
import type { TeamInvitation } from '@/lib/types'

import { sendTeamInvitationEmail } from '../email-notification-service.firestore'

// Mock Firebase Functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(),
}))

// Mock console methods to avoid test noise
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation()
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()

describe('Email Notification Service', () => {
  const mockHttpsCallable = httpsCallable as jest.MockedFunction<typeof httpsCallable>
  const mockGetFunctions = getFunctions as jest.MockedFunction<typeof getFunctions>
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mocks
    mockGetFunctions.mockReturnValue({} as any)
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

    it('should successfully call Firebase Function to send team invitation email', async () => {
      // Mock the Firebase Function call
      const mockFunction = jest.fn().mockResolvedValue({
        data: { success: true, emailId: 'resend-email-id', message: 'Email sent successfully' }
      })
      mockHttpsCallable.mockReturnValue(mockFunction)

      await expect(
        sendTeamInvitationEmail(mockInvitation, 'Test Team', 'John Doe', 'en'),
      ).resolves.not.toThrow()

      // Verify Firebase Function was called with correct parameters
      expect(mockHttpsCallable).toHaveBeenCalledWith({}, 'sendTeamInvitationEmail')
      expect(mockFunction).toHaveBeenCalledWith({
        invitationId: 'test-invitation-id',
        teamId: 'test-team-id',
        email: 'test@example.com',
        role: 'member',
        invitedBy: 'inviter-id',
      })

      // Verify logging
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        'Calling Firebase Function to send invitation email to test@example.com',
        expect.objectContaining({
          invitationId: 'test-invitation-id',
          teamId: 'test-team-id',
          teamName: 'Test Team',
          inviterName: 'John Doe',
          role: 'member',
          language: 'en',
        }),
      )

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        'Firebase Function call successful',
        { success: true, emailId: 'resend-email-id', message: 'Email sent successfully' }
      )
    })

    it('should handle Firebase Function errors and re-throw them', async () => {
      // Mock the Firebase Function to throw an error
      const mockError = new Error('Firebase Function failed')
      const mockFunction = jest.fn().mockRejectedValue(mockError)
      mockHttpsCallable.mockReturnValue(mockFunction)

      await expect(
        sendTeamInvitationEmail(mockInvitation, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Firebase Function failed')

      // Verify error was logged
      expect(mockConsoleError).toHaveBeenCalledWith('Firebase Function call failed', mockError)
    })

    it('should throw error when invitation email is missing', async () => {
      const invalidInvitation = { ...mockInvitation, email: '' }

      await expect(
        sendTeamInvitationEmail(invalidInvitation, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Invitation email is required')

      // Should not call Firebase Function for invalid input
      expect(mockHttpsCallable).not.toHaveBeenCalled()
    })

    it('should throw error when team ID is missing', async () => {
      const invalidInvitation = { ...mockInvitation, teamId: '' }

      await expect(
        sendTeamInvitationEmail(invalidInvitation, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Team ID and invitation ID are required')

      // Should not call Firebase Function for invalid input
      expect(mockHttpsCallable).not.toHaveBeenCalled()
    })

    it('should throw error when invitation ID is missing', async () => {
      const invalidInvitation = { ...mockInvitation, id: '' }

      await expect(
        sendTeamInvitationEmail(invalidInvitation, 'Test Team', 'John Doe'),
      ).rejects.toThrow('Team ID and invitation ID are required')

      // Should not call Firebase Function for invalid input
      expect(mockHttpsCallable).not.toHaveBeenCalled()
    })

    it('should use default language when not specified', async () => {
      const mockFunction = jest.fn().mockResolvedValue({
        data: { success: true }
      })
      mockHttpsCallable.mockReturnValue(mockFunction)

      await sendTeamInvitationEmail(mockInvitation, 'Test Team', 'John Doe')

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        'Calling Firebase Function to send invitation email to test@example.com',
        expect.objectContaining({
          language: 'en',
        }),
      )
    })

    it('should handle admin role invitations', async () => {
      const adminInvitation = { ...mockInvitation, role: 'admin' as const }
      const mockFunction = jest.fn().mockResolvedValue({
        data: { success: true }
      })
      mockHttpsCallable.mockReturnValue(mockFunction)

      await sendTeamInvitationEmail(adminInvitation, 'Test Team', 'John Doe')

      expect(mockFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'admin',
        })
      )

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        'Calling Firebase Function to send invitation email to test@example.com',
        expect.objectContaining({
          role: 'admin',
        }),
      )
    })

    it('should call getFunctions to initialize Firebase Functions', async () => {
      const mockFunction = jest.fn().mockResolvedValue({
        data: { success: true }
      })
      mockHttpsCallable.mockReturnValue(mockFunction)

      await sendTeamInvitationEmail(mockInvitation, 'Test Team', 'John Doe')

      expect(mockGetFunctions).toHaveBeenCalled()
    })
  })
})
