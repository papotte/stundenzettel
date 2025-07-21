// Mock the service modules
jest.mock('../user-deletion-service.firestore', () => ({
  deleteUserAccount: jest.fn(),
}))

jest.mock('../user-deletion-service.local', () => ({
  deleteUserAccount: jest.fn(),
}))

// Need to mock the module resolution for testing
jest.mock('../user-deletion-service', () => {
  const mockEnv = process.env.NEXT_PUBLIC_ENVIRONMENT

  if (mockEnv === 'test') {
    return {
      deleteUserAccount: jest.requireActual('../user-deletion-service.local').deleteUserAccount
    }
  } else {
    return {
      deleteUserAccount: jest.requireActual('../user-deletion-service.firestore').deleteUserAccount
    }
  }
})

describe('User Deletion Service', () => {
  const mockUserId = 'test-user-id'
  const mockPassword = 'testpassword123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Parameter validation', () => {
    it('should pass through parameters correctly', async () => {
      // Test with actual implementation
      const deleteUserAccountLocal = jest.requireActual('../user-deletion-service.local').deleteUserAccount
      
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

      await expect(deleteUserAccountLocal(mockUserId, mockPassword)).resolves.not.toThrow()
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalled()

      // Restore
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      })
    })

    it('should handle errors from underlying service', async () => {
      const deleteUserAccountLocal = jest.requireActual('../user-deletion-service.local').deleteUserAccount

      await expect(deleteUserAccountLocal('', mockPassword)).rejects.toThrow('User not authenticated')
    })
  })
})