import {
  hasPasswordAuthentication,
  updateUserPassword,
} from '../password-update-service'

// Mock the Firebase implementation
jest.mock('../password-update-service.firestore', () => ({
  updateUserPassword: jest.fn(),
  hasPasswordAuthentication: jest.fn(),
}))

// Mock the local implementation
jest.mock('../password-update-service.local', () => ({
  updateUserPassword: jest.fn(),
  hasPasswordAuthentication: jest.fn(),
}))

// Import the mocked modules after mocking
import * as mockFirestoreService from '../password-update-service.firestore'
import * as mockLocalService from '../password-update-service.local'

// Type the mock functions
const mockFirestoreUpdatePassword = mockFirestoreService.updateUserPassword as jest.MockedFunction<
  typeof mockFirestoreService.updateUserPassword
>
const mockFirestoreHasPassword = mockFirestoreService.hasPasswordAuthentication as jest.MockedFunction<
  typeof mockFirestoreService.hasPasswordAuthentication
>
const mockLocalUpdatePassword = mockLocalService.updateUserPassword as jest.MockedFunction<
  typeof mockLocalService.updateUserPassword
>
const mockLocalHasPassword = mockLocalService.hasPasswordAuthentication as jest.MockedFunction<
  typeof mockLocalService.hasPasswordAuthentication
>

describe('Password Update Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock implementations
    mockFirestoreUpdatePassword.mockReset()
    mockFirestoreHasPassword.mockReset()
    mockLocalUpdatePassword.mockReset()
    mockLocalHasPassword.mockReset()
  })

  describe('when using local service (test environment)', () => {
    beforeEach(() => {
      // Set environment to test mode
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'test'
    })

    afterEach(() => {
      delete process.env.NEXT_PUBLIC_ENVIRONMENT
    })

    it('should call local service for updateUserPassword', async () => {
      mockLocalUpdatePassword.mockResolvedValue(undefined)

      await updateUserPassword('user-id', 'current', 'new')

      expect(mockLocalUpdatePassword).toHaveBeenCalledWith(
        'user-id',
        'current',
        'new',
      )
      expect(mockFirestoreUpdatePassword).not.toHaveBeenCalled()
    })

    it('should call local service for hasPasswordAuthentication', async () => {
      mockLocalHasPassword.mockResolvedValue(true)

      const result = await hasPasswordAuthentication('user-id')

      expect(mockLocalHasPassword).toHaveBeenCalledWith(
        'user-id',
      )
      expect(result).toBe(true)
      expect(
        mockFirestoreHasPassword,
      ).not.toHaveBeenCalled()
    })
  })

  describe('when using firestore service (production environment)', () => {
    beforeEach(() => {
      // Remove test environment
      delete process.env.NEXT_PUBLIC_ENVIRONMENT
    })

    it('should call firestore service for updateUserPassword', async () => {
      mockFirestoreUpdatePassword.mockResolvedValue(undefined)

      await updateUserPassword('user-id', 'current', 'new')

      expect(mockFirestoreUpdatePassword).toHaveBeenCalledWith(
        'user-id',
        'current',
        'new',
      )
      expect(mockLocalUpdatePassword).not.toHaveBeenCalled()
    })

    it('should call firestore service for hasPasswordAuthentication', async () => {
      mockFirestoreHasPassword.mockResolvedValue(true)

      const result = await hasPasswordAuthentication('user-id')

      expect(
        mockFirestoreHasPassword,
      ).toHaveBeenCalledWith('user-id')
      expect(result).toBe(true)
      expect(mockLocalHasPassword).not.toHaveBeenCalled()
    })

    it('should propagate errors from firestore service', async () => {
      const error = new Error('Firebase error')
      mockFirestoreUpdatePassword.mockRejectedValue(error)

      await expect(
        updateUserPassword('user-id', 'current', 'new'),
      ).rejects.toThrow('Firebase error')
    })
  })
})
