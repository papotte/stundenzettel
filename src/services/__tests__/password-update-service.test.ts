import {
  hasPasswordAuthentication,
  updateUserPassword,
} from '../password-update-service'
import * as mockFirestoreService from '../password-update-service.firestore'
import * as mockLocalService from '../password-update-service.local'

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

describe('Password Update Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
      mockLocalService.updateUserPassword.mockResolvedValue(undefined)

      await updateUserPassword('user-id', 'current', 'new')

      expect(mockLocalService.updateUserPassword).toHaveBeenCalledWith(
        'user-id',
        'current',
        'new',
      )
      expect(mockFirestoreService.updateUserPassword).not.toHaveBeenCalled()
    })

    it('should call local service for hasPasswordAuthentication', async () => {
      mockLocalService.hasPasswordAuthentication.mockResolvedValue(true)

      const result = await hasPasswordAuthentication('user-id')

      expect(mockLocalService.hasPasswordAuthentication).toHaveBeenCalledWith(
        'user-id',
      )
      expect(result).toBe(true)
      expect(
        mockFirestoreService.hasPasswordAuthentication,
      ).not.toHaveBeenCalled()
    })
  })

  describe('when using firestore service (production environment)', () => {
    beforeEach(() => {
      // Remove test environment
      delete process.env.NEXT_PUBLIC_ENVIRONMENT
    })

    it('should call firestore service for updateUserPassword', async () => {
      mockFirestoreService.updateUserPassword.mockResolvedValue(undefined)

      await updateUserPassword('user-id', 'current', 'new')

      expect(mockFirestoreService.updateUserPassword).toHaveBeenCalledWith(
        'user-id',
        'current',
        'new',
      )
      expect(mockLocalService.updateUserPassword).not.toHaveBeenCalled()
    })

    it('should call firestore service for hasPasswordAuthentication', async () => {
      mockFirestoreService.hasPasswordAuthentication.mockResolvedValue(true)

      const result = await hasPasswordAuthentication('user-id')

      expect(
        mockFirestoreService.hasPasswordAuthentication,
      ).toHaveBeenCalledWith('user-id')
      expect(result).toBe(true)
      expect(mockLocalService.hasPasswordAuthentication).not.toHaveBeenCalled()
    })

    it('should propagate errors from firestore service', async () => {
      const error = new Error('Firebase error')
      mockFirestoreService.updateUserPassword.mockRejectedValue(error)

      await expect(
        updateUserPassword('user-id', 'current', 'new'),
      ).rejects.toThrow('Firebase error')
    })
  })
})
