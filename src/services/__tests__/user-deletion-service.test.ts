// Mock the service modules
jest.mock('../user-deletion-service.firestore', () => ({
  deleteUserAccount: jest.fn(),
  deleteUserAccountWithEmail: jest.fn(),
  deleteUserAccountWithGoogle: jest.fn(),
}))

jest.mock('../user-deletion-service.local', () => ({
  deleteUserAccount: jest.fn(),
  deleteUserAccountWithEmail: jest.fn(),
  deleteUserAccountWithGoogle: jest.fn(),
}))

// Need to mock the module resolution for testing
jest.mock('../user-deletion-service', () => {
  const mockEnv = process.env.NEXT_PUBLIC_ENVIRONMENT

  if (mockEnv === 'test') {
    return {
      deleteUserAccount: jest.requireActual('../user-deletion-service.local')
        .deleteUserAccount,
      deleteUserAccountWithEmail: jest.requireActual(
        '../user-deletion-service.local',
      ).deleteUserAccountWithEmail,
      deleteUserAccountWithGoogle: jest.requireActual(
        '../user-deletion-service.local',
      ).deleteUserAccountWithGoogle,
    }
  } else {
    return {
      deleteUserAccount: jest.requireActual(
        '../user-deletion-service.firestore',
      ).deleteUserAccount,
      deleteUserAccountWithEmail: jest.requireActual(
        '../user-deletion-service.firestore',
      ).deleteUserAccountWithEmail,
      deleteUserAccountWithGoogle: jest.requireActual(
        '../user-deletion-service.firestore',
      ).deleteUserAccountWithGoogle,
    }
  }
})

describe('User Deletion Service', () => {
  const mockUserId = 'test-user-id'
  const mockPassword = 'testpassword123'
  const mockEmail = 'user@example.com'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Parameter validation', () => {
    it('should pass through parameters correctly for password authentication', async () => {
      // Test with actual implementation
      const deleteUserAccountLocal = jest.requireActual(
        '../user-deletion-service.local',
      ).deleteUserAccount

      // Mock localStorage for this test
      const originalLocalStorage = window.localStorage
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 0,
        key: jest.fn(),
      }
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      })

      await expect(
        deleteUserAccountLocal(mockUserId, mockPassword),
      ).resolves.not.toThrow()

      expect(mockLocalStorage.removeItem).toHaveBeenCalled()

      // Restore
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      })
    })

    it('should pass through parameters correctly for email authentication', async () => {
      const deleteUserAccountWithEmailLocal = jest.requireActual(
        '../user-deletion-service.local',
      ).deleteUserAccountWithEmail

      // Mock localStorage for this test
      const originalLocalStorage = window.localStorage
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 0,
        key: jest.fn(),
      }
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      })

      await expect(
        deleteUserAccountWithEmailLocal(mockUserId, mockEmail),
      ).resolves.not.toThrow()

      expect(mockLocalStorage.removeItem).toHaveBeenCalled()

      // Restore
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      })
    })

    it('should pass through parameters correctly for Google authentication', async () => {
      const deleteUserAccountWithGoogleLocal = jest.requireActual(
        '../user-deletion-service.local',
      ).deleteUserAccountWithGoogle

      // Mock localStorage for this test
      const originalLocalStorage = window.localStorage
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 0,
        key: jest.fn(),
      }
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      })

      await expect(
        deleteUserAccountWithGoogleLocal(mockUserId),
      ).resolves.not.toThrow()

      expect(mockLocalStorage.removeItem).toHaveBeenCalled()

      // Restore
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      })
    })

    it('should handle errors from underlying service', async () => {
      const deleteUserAccountLocal = jest.requireActual(
        '../user-deletion-service.local',
      ).deleteUserAccount

      await expect(deleteUserAccountLocal('', mockPassword)).rejects.toThrow(
        'User not authenticated',
      )
    })

    it('should handle errors for email authentication', async () => {
      const deleteUserAccountWithEmailLocal = jest.requireActual(
        '../user-deletion-service.local',
      ).deleteUserAccountWithEmail

      await expect(
        deleteUserAccountWithEmailLocal('', mockEmail),
      ).rejects.toThrow('User not authenticated')
      await expect(
        deleteUserAccountWithEmailLocal(mockUserId, ''),
      ).rejects.toThrow('Email is required for account deletion')
      await expect(
        deleteUserAccountWithEmailLocal(mockUserId, 'invalid-email'),
      ).rejects.toThrow('Invalid email format')
    })

    it('should handle errors for Google authentication', async () => {
      const deleteUserAccountWithGoogleLocal = jest.requireActual(
        '../user-deletion-service.local',
      ).deleteUserAccountWithGoogle

      await expect(deleteUserAccountWithGoogleLocal('')).rejects.toThrow(
        'User not authenticated',
      )
    })
  })
})
