import * as userDeletionService from '../user-deletion-service'
import * as firestoreService from '../user-deletion-service.firestore'

// Mock the Firestore service module
jest.mock('../user-deletion-service.firestore', () => ({
  deleteUserAccount: jest.fn(),
  deleteUserAccountWithEmail: jest.fn(),
  deleteUserAccountWithGoogle: jest.fn(),
}))

const mockFirestoreService = firestoreService as jest.Mocked<
  typeof firestoreService
>

describe('User Deletion Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Service delegation to Firestore', () => {
    it('should delegate deleteUserAccount to Firestore service', async () => {
      mockFirestoreService.deleteUserAccount.mockResolvedValue()

      await userDeletionService.deleteUserAccount('user-123', 'password')

      expect(mockFirestoreService.deleteUserAccount).toHaveBeenCalledWith(
        'user-123',
        'password',
      )
    })

    it('should delegate deleteUserAccountWithEmail to Firestore service', async () => {
      mockFirestoreService.deleteUserAccountWithEmail.mockResolvedValue()

      await userDeletionService.deleteUserAccountWithEmail(
        'user-123',
        'test@example.com',
      )

      expect(
        mockFirestoreService.deleteUserAccountWithEmail,
      ).toHaveBeenCalledWith('user-123', 'test@example.com')
    })

    it('should delegate deleteUserAccountWithGoogle to Firestore service', async () => {
      mockFirestoreService.deleteUserAccountWithGoogle.mockResolvedValue()

      await userDeletionService.deleteUserAccountWithGoogle('user-123')

      expect(
        mockFirestoreService.deleteUserAccountWithGoogle,
      ).toHaveBeenCalledWith('user-123')
    })

    it('should propagate errors from Firestore service', async () => {
      const error = new Error('Firestore error')
      mockFirestoreService.deleteUserAccount.mockRejectedValue(error)

      await expect(
        userDeletionService.deleteUserAccount('user-123', 'password'),
      ).rejects.toThrow('Firestore error')
    })
  })
})
