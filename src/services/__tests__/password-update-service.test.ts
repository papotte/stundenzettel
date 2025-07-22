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
    let updateUserPassword: typeof import('../password-update-service').updateUserPassword
    let hasPasswordAuthentication: typeof import('../password-update-service').hasPasswordAuthentication
    let mockLocalUpdatePassword: jest.Mock
    let mockLocalHasPassword: jest.Mock
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
      const mockLocalService = await import('../password-update-service.local')
      const mockFirestoreService = await import(
        '../password-update-service.firestore'
      )
      mockLocalUpdatePassword = mockLocalService.updateUserPassword as jest.Mock
      mockLocalHasPassword =
        mockLocalService.hasPasswordAuthentication as jest.Mock
      mockFirestoreUpdatePassword =
        mockFirestoreService.updateUserPassword as jest.Mock
      mockFirestoreHasPassword =
        mockFirestoreService.hasPasswordAuthentication as jest.Mock
      jest.clearAllMocks()
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

      expect(mockLocalHasPassword).toHaveBeenCalledWith('user-id')
      expect(result).toBe(true)
      expect(mockFirestoreHasPassword).not.toHaveBeenCalled()
    })
  })

  describe('when using firestore service (production environment)', () => {
    let updateUserPassword: typeof import('../password-update-service').updateUserPassword
    let hasPasswordAuthentication: typeof import('../password-update-service').hasPasswordAuthentication
    let mockLocalUpdatePassword: jest.Mock
    let mockLocalHasPassword: jest.Mock
    let mockFirestoreUpdatePassword: jest.Mock
    let mockFirestoreHasPassword: jest.Mock

    beforeEach(async () => {
      jest.resetModules()
      delete process.env.NEXT_PUBLIC_ENVIRONMENT
      // Use dynamic import after setting env
      const passwordUpdateService = await import('../password-update-service')
      updateUserPassword = passwordUpdateService.updateUserPassword
      hasPasswordAuthentication =
        passwordUpdateService.hasPasswordAuthentication
      const mockLocalService = await import('../password-update-service.local')
      const mockFirestoreService = await import(
        '../password-update-service.firestore'
      )
      mockLocalUpdatePassword = mockLocalService.updateUserPassword as jest.Mock
      mockLocalHasPassword =
        mockLocalService.hasPasswordAuthentication as jest.Mock
      mockFirestoreUpdatePassword =
        mockFirestoreService.updateUserPassword as jest.Mock
      mockFirestoreHasPassword =
        mockFirestoreService.hasPasswordAuthentication as jest.Mock
      jest.clearAllMocks()
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

      expect(mockFirestoreHasPassword).toHaveBeenCalledWith('user-id')
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
