import {
  EmailAuthProvider,
  GoogleAuthProvider,
  type User,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from 'firebase/auth'
import { deleteDoc, getDocs, writeBatch } from 'firebase/firestore'

import { auth, db } from '@/lib/firebase'

import * as userDeletionService from '../user-deletion-service'

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  EmailAuthProvider: {
    credential: jest.fn(),
  },
  GoogleAuthProvider: jest.fn(),
  deleteUser: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  reauthenticateWithPopup: jest.fn(),
}))

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  writeBatch: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}))

const mockDb = db as jest.Mocked<typeof db>
const mockDeleteUser = deleteUser as jest.MockedFunction<typeof deleteUser>
const mockReauthenticateWithCredential =
  reauthenticateWithCredential as jest.MockedFunction<
    typeof reauthenticateWithCredential
  >
const mockReauthenticateWithPopup =
  reauthenticateWithPopup as jest.MockedFunction<typeof reauthenticateWithPopup>
const mockWriteBatch = writeBatch as jest.MockedFunction<typeof writeBatch>
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>
const mockEmailAuthProviderCredential =
  EmailAuthProvider.credential as jest.MockedFunction<
    typeof EmailAuthProvider.credential
  >
const mockGoogleAuthProvider = GoogleAuthProvider as jest.MockedClass<
  typeof GoogleAuthProvider
>

describe('User Deletion Service', () => {
  const mockUser = {
    uid: 'user-123',
    email: 'test@example.com',
  } as User

  const mockBatch = {
    delete: jest.fn(),
    commit: jest.fn(),
  }

  const mockCredential = { type: 'email' }

  // Helper function to set auth.currentUser
  const setCurrentUser = (user: User | null) => {
    Object.defineProperty(auth, 'currentUser', {
      value: user,
      writable: true,
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    setCurrentUser(mockUser)
    mockWriteBatch.mockReturnValue(mockBatch as never)
    mockEmailAuthProviderCredential.mockReturnValue(mockCredential as never)
    mockGoogleAuthProvider.mockImplementation(() => ({}) as never)
    mockGetDocs.mockResolvedValue({
      docs: [{ ref: { id: 'entry-1' } }, { ref: { id: 'entry-2' } }],
    } as never)
  })

  describe('deleteUserAccount', () => {
    it('should delete user account with password authentication', async () => {
      mockReauthenticateWithCredential.mockResolvedValue({} as never)

      await userDeletionService.deleteUserAccount('user-123', 'password')

      expect(mockEmailAuthProviderCredential).toHaveBeenCalledWith(
        'test@example.com',
        'password',
      )
      expect(mockReauthenticateWithCredential).toHaveBeenCalledWith(
        mockUser,
        mockCredential,
      )
      expect(mockWriteBatch).toHaveBeenCalledWith(mockDb)
      expect(mockBatch.delete).toHaveBeenCalled()
      expect(mockBatch.commit).toHaveBeenCalled()
      expect(mockDeleteDoc).toHaveBeenCalled()
      expect(mockDeleteUser).toHaveBeenCalledWith(mockUser)
    })

    it('should throw error when user is not authenticated', async () => {
      setCurrentUser(null)

      await expect(
        userDeletionService.deleteUserAccount('user-123', 'password'),
      ).rejects.toThrow('User not authenticated')
    })

    it('should throw error when user ID does not match', async () => {
      await expect(
        userDeletionService.deleteUserAccount('different-user', 'password'),
      ).rejects.toThrow('User not authenticated or mismatched user ID')
    })

    it('should throw error when password is missing', async () => {
      await expect(
        userDeletionService.deleteUserAccount('user-123', ''),
      ).rejects.toThrow('Password is required for account deletion')
    })

    it('should handle errors during deletion', async () => {
      const error = new Error('Deletion failed')
      mockReauthenticateWithCredential.mockRejectedValue(error)

      await expect(
        userDeletionService.deleteUserAccount('user-123', 'password'),
      ).rejects.toThrow('Deletion failed')
    })
  })

  describe('deleteUserAccountWithEmail', () => {
    it('should delete user account with email confirmation', async () => {
      await userDeletionService.deleteUserAccountWithEmail(
        'user-123',
        'test@example.com',
      )

      expect(mockWriteBatch).toHaveBeenCalledWith(mockDb)
      expect(mockBatch.delete).toHaveBeenCalled()
      expect(mockBatch.commit).toHaveBeenCalled()
      expect(mockDeleteDoc).toHaveBeenCalled()
      expect(mockDeleteUser).toHaveBeenCalledWith(mockUser)
    })

    it('should throw error when email does not match', async () => {
      await expect(
        userDeletionService.deleteUserAccountWithEmail(
          'user-123',
          'different@example.com',
        ),
      ).rejects.toThrow('Email does not match current user')
    })

    it('should throw error when email is missing', async () => {
      await expect(
        userDeletionService.deleteUserAccountWithEmail('user-123', ''),
      ).rejects.toThrow('Email is required for account deletion')
    })
  })

  describe('deleteUserAccountWithGoogle', () => {
    it('should delete user account with Google re-authentication', async () => {
      mockReauthenticateWithPopup.mockResolvedValue({} as never)

      await userDeletionService.deleteUserAccountWithGoogle('user-123')

      expect(mockGoogleAuthProvider).toHaveBeenCalled()
      expect(mockReauthenticateWithPopup).toHaveBeenCalledWith(mockUser, {})
      expect(mockWriteBatch).toHaveBeenCalledWith(mockDb)
      expect(mockBatch.delete).toHaveBeenCalled()
      expect(mockBatch.commit).toHaveBeenCalled()
      expect(mockDeleteDoc).toHaveBeenCalled()
      expect(mockDeleteUser).toHaveBeenCalledWith(mockUser)
    })

    it('should throw error when user is not authenticated', async () => {
      setCurrentUser(null)

      await expect(
        userDeletionService.deleteUserAccountWithGoogle('user-123'),
      ).rejects.toThrow('User not authenticated')
    })
  })
})
