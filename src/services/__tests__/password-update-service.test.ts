import {
  EmailAuthProvider,
  type User,
  type UserInfo,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth'

import { auth } from '@/lib/firebase'

import {
  hasPasswordAuthentication,
  updateUserPassword,
} from '../password-update-service'

// Mock Firebase Auth functions
jest.mock('firebase/auth', () => ({
  EmailAuthProvider: {
    credential: jest.fn(),
  },
  reauthenticateWithCredential: jest.fn(),
  updatePassword: jest.fn(),
}))

// Mock the Firebase auth instance
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: null,
  },
}))

describe('Password Update Service', () => {
  const mockEmailAuthProvider = EmailAuthProvider as jest.Mocked<
    typeof EmailAuthProvider
  >
  const mockReauthenticateWithCredential =
    reauthenticateWithCredential as jest.MockedFunction<
      typeof reauthenticateWithCredential
    >
  const mockUpdatePassword = updatePassword as jest.MockedFunction<
    typeof updatePassword
  >

  // Helper function to set auth.currentUser
  const setCurrentUser = (user: User | null) => {
    Object.defineProperty(auth, 'currentUser', {
      value: user,
      writable: true,
    })
  }

  // Helper function to create mock UserInfo objects
  const createMockUserInfo = (providerId: string): UserInfo => ({
    uid: 'test-uid',
    displayName: null,
    email: 'test@example.com',
    phoneNumber: null,
    photoURL: null,
    providerId,
  })

  // Helper function to create mock User objects
  const createMockUser = (overrides: Partial<User> = {}): User =>
    ({
      uid: 'test-user-id',
      email: 'test@example.com',
      providerData: [],
      ...overrides,
    }) as User

  beforeEach(() => {
    jest.clearAllMocks()
    setCurrentUser(null)
  })

  describe('updateUserPassword', () => {
    const userId = 'test-user-id'
    const currentPassword = 'current-password'
    const newPassword = 'new-password'
    const userEmail = 'test@example.com'

    const mockUser = createMockUser({
      uid: userId,
      email: userEmail,
    })

    beforeEach(() => {
      mockEmailAuthProvider.credential.mockReturnValue({} as never)
    })

    it('should successfully update password when user is authenticated', async () => {
      setCurrentUser(mockUser)
      mockReauthenticateWithCredential.mockResolvedValue({} as never)
      mockUpdatePassword.mockResolvedValue(undefined)

      await updateUserPassword(userId, currentPassword, newPassword)

      expect(mockEmailAuthProvider.credential).toHaveBeenCalledWith(
        userEmail,
        currentPassword,
      )
      expect(mockReauthenticateWithCredential).toHaveBeenCalledWith(
        mockUser,
        {},
      )
      expect(mockUpdatePassword).toHaveBeenCalledWith(mockUser, newPassword)
    })

    it('should throw error when userId is empty', async () => {
      await expect(
        updateUserPassword('', currentPassword, newPassword),
      ).rejects.toThrow('User not authenticated')
    })

    it('should throw error when currentPassword is empty', async () => {
      await expect(updateUserPassword(userId, '', newPassword)).rejects.toThrow(
        'Current password is required',
      )
    })

    it('should throw error when newPassword is empty', async () => {
      await expect(
        updateUserPassword(userId, currentPassword, ''),
      ).rejects.toThrow('New password is required')
    })

    it('should throw error when no user is authenticated', async () => {
      setCurrentUser(null)

      await expect(
        updateUserPassword(userId, currentPassword, newPassword),
      ).rejects.toThrow('User not authenticated or mismatched user ID')
    })

    it('should throw error when user ID does not match current user', async () => {
      setCurrentUser({ ...mockUser, uid: 'different-user-id' })

      await expect(
        updateUserPassword(userId, currentPassword, newPassword),
      ).rejects.toThrow('User not authenticated or mismatched user ID')
    })

    it('should throw error when user has no email', async () => {
      setCurrentUser({ ...mockUser, email: null })

      await expect(
        updateUserPassword(userId, currentPassword, newPassword),
      ).rejects.toThrow('User does not have email authentication')
    })

    it('should throw error when reauthentication fails', async () => {
      setCurrentUser(mockUser)
      const authError = new Error('Invalid password')
      mockReauthenticateWithCredential.mockRejectedValue(authError)

      await expect(
        updateUserPassword(userId, currentPassword, newPassword),
      ).rejects.toThrow('Invalid password')

      expect(mockEmailAuthProvider.credential).toHaveBeenCalledWith(
        userEmail,
        currentPassword,
      )
      expect(mockReauthenticateWithCredential).toHaveBeenCalledWith(
        mockUser,
        {},
      )
      expect(mockUpdatePassword).not.toHaveBeenCalled()
    })

    it('should throw error when password update fails', async () => {
      setCurrentUser(mockUser)
      mockReauthenticateWithCredential.mockResolvedValue({} as never)
      const updateError = new Error('Password update failed')
      mockUpdatePassword.mockRejectedValue(updateError)

      await expect(
        updateUserPassword(userId, currentPassword, newPassword),
      ).rejects.toThrow('Password update failed')

      expect(mockEmailAuthProvider.credential).toHaveBeenCalledWith(
        userEmail,
        currentPassword,
      )
      expect(mockReauthenticateWithCredential).toHaveBeenCalledWith(
        mockUser,
        {},
      )
      expect(mockUpdatePassword).toHaveBeenCalledWith(mockUser, newPassword)
    })

    it('should handle network errors during reauthentication', async () => {
      setCurrentUser(mockUser)
      const networkError = new Error('Network request failed')
      mockReauthenticateWithCredential.mockRejectedValue(networkError)

      await expect(
        updateUserPassword(userId, currentPassword, newPassword),
      ).rejects.toThrow('Network request failed')
    })

    it('should handle network errors during password update', async () => {
      setCurrentUser(mockUser)
      mockReauthenticateWithCredential.mockResolvedValue({} as never)
      const networkError = new Error('Network request failed')
      mockUpdatePassword.mockRejectedValue(networkError)

      await expect(
        updateUserPassword(userId, currentPassword, newPassword),
      ).rejects.toThrow('Network request failed')
    })
  })

  describe('hasPasswordAuthentication', () => {
    const userId = 'test-user-id'

    it('should return false when userId is empty', async () => {
      const result = await hasPasswordAuthentication('')
      expect(result).toBe(false)
    })

    it('should return false when no user is authenticated', async () => {
      setCurrentUser(null)

      const result = await hasPasswordAuthentication(userId)
      expect(result).toBe(false)
    })

    it('should return false when user ID does not match current user', async () => {
      const mockUser = createMockUser({
        uid: 'different-user-id',
        providerData: [createMockUserInfo('password')],
      })
      setCurrentUser(mockUser)

      const result = await hasPasswordAuthentication(userId)
      expect(result).toBe(false)
    })

    it('should return true when user has password provider', async () => {
      const mockUser = createMockUser({
        uid: userId,
        providerData: [
          createMockUserInfo('google.com'),
          createMockUserInfo('password'),
          createMockUserInfo('facebook.com'),
        ],
      })
      setCurrentUser(mockUser)

      const result = await hasPasswordAuthentication(userId)
      expect(result).toBe(true)
    })

    it('should return false when user has no password provider', async () => {
      const mockUser = createMockUser({
        uid: userId,
        providerData: [
          createMockUserInfo('google.com'),
          createMockUserInfo('facebook.com'),
        ],
      })
      setCurrentUser(mockUser)

      const result = await hasPasswordAuthentication(userId)
      expect(result).toBe(false)
    })

    it('should return false when user has empty provider data', async () => {
      const mockUser = createMockUser({
        uid: userId,
        providerData: [],
      })
      setCurrentUser(mockUser)

      const result = await hasPasswordAuthentication(userId)
      expect(result).toBe(false)
    })

    it('should return false when user has undefined provider data', async () => {
      const mockUser = createMockUser({
        uid: userId,
        providerData: undefined,
      })
      setCurrentUser(mockUser)

      const result = await hasPasswordAuthentication(userId)
      expect(result).toBe(false)
    })

    it('should handle user with only password provider', async () => {
      const mockUser = createMockUser({
        uid: userId,
        providerData: [createMockUserInfo('password')],
      })
      setCurrentUser(mockUser)

      const result = await hasPasswordAuthentication(userId)
      expect(result).toBe(true)
    })

    it('should handle user with multiple password providers (edge case)', async () => {
      const mockUser = createMockUser({
        uid: userId,
        providerData: [
          createMockUserInfo('password'),
          createMockUserInfo('password'),
          createMockUserInfo('google.com'),
        ],
      })
      setCurrentUser(mockUser)

      const result = await hasPasswordAuthentication(userId)
      expect(result).toBe(true)
    })
  })

  describe('integration scenarios', () => {
    const userId = 'test-user-id'
    const currentPassword = 'current-password'
    const newPassword = 'new-password'
    const userEmail = 'test@example.com'

    it('should handle complete password update flow', async () => {
      const mockUser = createMockUser({
        uid: userId,
        email: userEmail,
        providerData: [createMockUserInfo('password')],
      })
      setCurrentUser(mockUser)
      mockEmailAuthProvider.credential.mockReturnValue({} as never)
      mockReauthenticateWithCredential.mockResolvedValue({} as never)
      mockUpdatePassword.mockResolvedValue(undefined)

      // First check if user has password authentication
      const hasPassword = await hasPasswordAuthentication(userId)
      expect(hasPassword).toBe(true)

      // Then update the password
      await updateUserPassword(userId, currentPassword, newPassword)

      expect(mockEmailAuthProvider.credential).toHaveBeenCalledWith(
        userEmail,
        currentPassword,
      )
      expect(mockReauthenticateWithCredential).toHaveBeenCalledWith(
        mockUser,
        {},
      )
      expect(mockUpdatePassword).toHaveBeenCalledWith(mockUser, newPassword)
    })

    it('should handle user without password authentication trying to update password', async () => {
      const mockUser = createMockUser({
        uid: userId,
        email: userEmail,
        providerData: [createMockUserInfo('google.com')],
      })
      setCurrentUser(mockUser)

      // Check if user has password authentication
      const hasPassword = await hasPasswordAuthentication(userId)
      expect(hasPassword).toBe(false)

      // User should not be able to update password
      mockEmailAuthProvider.credential.mockReturnValue({} as never)
      mockReauthenticateWithCredential.mockResolvedValue({} as never)
      mockUpdatePassword.mockResolvedValue(undefined)

      // This should still work technically, but the UI should prevent it
      await updateUserPassword(userId, currentPassword, newPassword)
      expect(mockUpdatePassword).toHaveBeenCalled()
    })
  })
})
