// Mock the Firebase implementation
jest.mock('../password-update-service.firestore', () => ({
  updateUserPassword: jest.fn(),
  hasPasswordAuthentication: jest.fn(),
}))

describe('Password Update Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when using Firestore service (all environments)', () => {
    let updateUserPassword: typeof import('../password-update-service').updateUserPassword
    let hasPasswordAuthentication: typeof import('../password-update-service').hasPasswordAuthentication
    let mockFirestoreUpdatePassword: jest.Mock
    let mockFirestoreHasPassword: jest.Mock

    beforeEach(async () => {
      jest.resetModules()
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'test'
      // Use dynamic import after setting env
      const passwordUpdateService = await import('../password-update-service')
      updateUserPassword = passwordUpdateService.updateUserPassword
      hasPasswordAuthentication =
        passwordUpdateService.hasPasswordAuthentication
      const mockFirestoreService = await import(
        '../password-update-service.firestore'
      )
      mockFirestoreUpdatePassword =
        mockFirestoreService.updateUserPassword as jest.Mock
      mockFirestoreHasPassword =
        mockFirestoreService.hasPasswordAuthentication as jest.Mock
      jest.clearAllMocks()
    })

    afterEach(() => {
      delete process.env.NEXT_PUBLIC_ENVIRONMENT
    })

    it('should call Firestore service for updateUserPassword', async () => {
      mockFirestoreUpdatePassword.mockResolvedValue(undefined)

      await updateUserPassword('user-id', 'current', 'new')

      expect(mockFirestoreUpdatePassword).toHaveBeenCalledWith(
        'user-id',
        'current',
        'new',
      )
    })

    it('should call Firestore service for hasPasswordAuthentication', async () => {
      mockFirestoreHasPassword.mockResolvedValue(true)

      const result = await hasPasswordAuthentication('user-id')

      expect(mockFirestoreHasPassword).toHaveBeenCalledWith('user-id')
      expect(result).toBe(true)
    })

    it('should propagate errors from Firestore service', async () => {
      const error = new Error('Firebase error')
      mockFirestoreUpdatePassword.mockRejectedValue(error)

      await expect(
        updateUserPassword('user-id', 'current', 'new'),
      ).rejects.toThrow('Firebase error')
    })
  })
})
