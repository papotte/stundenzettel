import {
  clearMockUsers,
  setMockUserAuth,
  updateUserPassword,
  hasPasswordAuthentication,
} from '../password-update-service.local'

describe('Password Update Service (Local)', () => {
  beforeEach(() => {
    clearMockUsers()
    jest.clearAllMocks()
  })

  describe('updateUserPassword', () => {
    it('should update password successfully', async () => {
      const userId = 'test-user-id'
      setMockUserAuth(userId, 'test@example.com', true)

      await expect(
        updateUserPassword(userId, 'currentpassword', 'newpassword123'),
      ).resolves.not.toThrow()
    })

    it('should throw error for missing userId', async () => {
      await expect(
        updateUserPassword('', 'currentpassword', 'newpassword123'),
      ).rejects.toThrow('User not authenticated')
    })

    it('should throw error for missing current password', async () => {
      const userId = 'test-user-id'
      setMockUserAuth(userId, 'test@example.com', true)

      await expect(
        updateUserPassword(userId, '', 'newpassword123'),
      ).rejects.toThrow('Current password is required')
    })

    it('should throw error for missing new password', async () => {
      const userId = 'test-user-id'
      setMockUserAuth(userId, 'test@example.com', true)

      await expect(
        updateUserPassword(userId, 'currentpassword', ''),
      ).rejects.toThrow('New password is required')
    })

    it('should throw error for user not found', async () => {
      await expect(
        updateUserPassword('nonexistent-user', 'currentpassword', 'newpassword123'),
      ).rejects.toThrow('User not found')
    })

    it('should throw error for user without password authentication', async () => {
      const userId = 'test-user-id'
      setMockUserAuth(userId, 'test@example.com', false)

      await expect(
        updateUserPassword(userId, 'currentpassword', 'newpassword123'),
      ).rejects.toThrow('User does not have email authentication')
    })

    it('should throw error for wrong current password', async () => {
      const userId = 'test-user-id'
      setMockUserAuth(userId, 'test@example.com', true)

      await expect(
        updateUserPassword(userId, 'wrongpassword', 'newpassword123'),
      ).rejects.toThrow('Invalid password')
    })

    it('should throw error for short new password', async () => {
      const userId = 'test-user-id'
      setMockUserAuth(userId, 'test@example.com', true)

      await expect(
        updateUserPassword(userId, 'currentpassword', 'short'),
      ).rejects.toThrow('Password must be at least 8 characters')
    })
  })

  describe('hasPasswordAuthentication', () => {
    it('should return true for user with password authentication', async () => {
      const userId = 'test-user-id'
      setMockUserAuth(userId, 'test@example.com', true)

      const result = await hasPasswordAuthentication(userId)
      expect(result).toBe(true)
    })

    it('should return false for user without password authentication', async () => {
      const userId = 'test-user-id'
      setMockUserAuth(userId, 'test@example.com', false)

      const result = await hasPasswordAuthentication(userId)
      expect(result).toBe(false)
    })

    it('should return false for empty userId', async () => {
      const result = await hasPasswordAuthentication('')
      expect(result).toBe(false)
    })

    it('should return true by default for new test users', async () => {
      const result = await hasPasswordAuthentication('new-test-user')
      expect(result).toBe(true)
    })
  })
})