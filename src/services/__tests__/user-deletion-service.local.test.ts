import { deleteUserAccount } from '../user-deletion-service.local'

describe('User Deletion Service - Local Implementation', () => {
  const mockUserId = 'test-user-123'
  const mockPassword = 'validpassword'

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    
    // Setup some test data
    localStorage.setItem('mockUser', JSON.stringify({
      uid: mockUserId,
      email: 'test@example.com',
      displayName: 'Test User'
    }))
    localStorage.setItem(`userSettings_${mockUserId}`, JSON.stringify({
      defaultWorkHours: 8,
      language: 'en'
    }))
    localStorage.setItem(`timeEntries_${mockUserId}`, JSON.stringify([
      { id: '1', location: 'Office', startTime: new Date() }
    ]))
    localStorage.setItem(`someOtherUserData_${mockUserId}`, 'test data')
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Successful deletion', () => {
    it('should delete all user data from localStorage', async () => {
      // Verify data exists before deletion
      expect(localStorage.getItem('mockUser')).not.toBeNull()
      expect(localStorage.getItem(`userSettings_${mockUserId}`)).not.toBeNull()
      expect(localStorage.getItem(`timeEntries_${mockUserId}`)).not.toBeNull()
      expect(localStorage.getItem(`someOtherUserData_${mockUserId}`)).not.toBeNull()

      await deleteUserAccount(mockUserId, mockPassword)

      // Verify all user-related data is deleted
      expect(localStorage.getItem('mockUser')).toBeNull()
      expect(localStorage.getItem(`userSettings_${mockUserId}`)).toBeNull()
      expect(localStorage.getItem(`timeEntries_${mockUserId}`)).toBeNull()
      expect(localStorage.getItem(`someOtherUserData_${mockUserId}`)).toBeNull()
    })

    it('should delete only data related to the specific user', async () => {
      const otherUserId = 'other-user-456'
      localStorage.setItem(`userSettings_${otherUserId}`, JSON.stringify({
        defaultWorkHours: 7
      }))
      localStorage.setItem('globalSetting', 'should remain')

      await deleteUserAccount(mockUserId, mockPassword)

      // Other user's data should remain
      expect(localStorage.getItem(`userSettings_${otherUserId}`)).not.toBeNull()
      expect(localStorage.getItem('globalSetting')).not.toBeNull()
      
      // Current user's data should be gone
      expect(localStorage.getItem(`userSettings_${mockUserId}`)).toBeNull()
    })

    it('should log successful deletion', async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation()

      await deleteUserAccount(mockUserId, mockPassword)

      expect(consoleSpy).toHaveBeenCalledWith(
        `Mock user account deleted for user ${mockUserId}`
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Error handling', () => {
    it('should throw error for empty userId', async () => {
      await expect(deleteUserAccount('', mockPassword)).rejects.toThrow(
        'User not authenticated'
      )
    })

    it('should throw error for empty password', async () => {
      await expect(deleteUserAccount(mockUserId, '')).rejects.toThrow(
        'Password is required for account deletion'
      )
    })

    it('should throw error for short password', async () => {
      await expect(deleteUserAccount(mockUserId, '12345')).rejects.toThrow(
        'Invalid password'
      )
    })
  })

  describe('Password validation', () => {
    it('should accept valid passwords', async () => {
      const validPasswords = [
        'password123',
        'verylongpassword',
        'Pass@123',
        '123456'
      ]

      for (const password of validPasswords) {
        // Reset localStorage for each test
        localStorage.setItem('mockUser', JSON.stringify({ uid: mockUserId }))
        
        await expect(deleteUserAccount(mockUserId, password)).resolves.not.toThrow()
      }
    })

    it('should reject passwords that are too short', async () => {
      const shortPasswords = ['', '1', '12', '123', '1234', '12345']

      for (const password of shortPasswords) {
        await expect(deleteUserAccount(mockUserId, password)).rejects.toThrow()
      }
    })
  })
})