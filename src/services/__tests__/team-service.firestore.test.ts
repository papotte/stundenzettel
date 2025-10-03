/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type CollectionReference,
  type DocumentReference,
  type DocumentSnapshot,
  type Query,
  type QueryFieldFilterConstraint,
  type QueryOrderByConstraint,
  type QuerySnapshot,
  type WriteBatch,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'

import { sendTeamInvitationEmail } from '../email-notification-service'
import * as firestoreService from '../team-service.firestore'

// Mock email notification service
jest.mock('../email-notification-service', () => ({
  sendTeamInvitationEmail: jest.fn(),
}))

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
}))

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  setDoc: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: (date.getTime() % 1000) * 1000000,
    })),
  },
  updateDoc: jest.fn(),
  where: jest.fn(),
  writeBatch: jest.fn(),
  FirestoreError: class FirestoreError extends Error {
    constructor(
      public code: string,
      message: string,
    ) {
      super(message)
      this.name = 'FirestoreError'
    }
  },
}))

const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>
const mockCollection = collection as jest.MockedFunction<typeof collection>
const mockDoc = doc as jest.MockedFunction<typeof doc>
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>
const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>
const mockQuery = query as jest.MockedFunction<typeof query>
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<
  typeof serverTimestamp
>
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>
const mockWhere = where as jest.MockedFunction<typeof where>
const mockWriteBatch = writeBatch as jest.MockedFunction<typeof writeBatch>
const mockSendTeamInvitationEmail =
  sendTeamInvitationEmail as jest.MockedFunction<typeof sendTeamInvitationEmail>

// Create a mock FirestoreError class
const FirestoreError = class extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'FirestoreError'
  }
}

// Helper function to create mock Firestore timestamp
const createMockTimestamp = (date: Date) => ({
  toDate: () => date,
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: (date.getTime() % 1000) * 1000000,
})

describe('TeamService Firestore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockServerTimestamp.mockReturnValue(new Date('2024-01-01T00:00:00Z') as any)
    mockSendTeamInvitationEmail.mockResolvedValue(undefined)
  })

  describe('createTeam', () => {
    it('creates team successfully with owner as first member', async () => {
      const mockDocRef = { id: 'team123' } as DocumentReference
      mockAddDoc.mockResolvedValue(mockDocRef)
      mockCollection.mockReturnValue({} as CollectionReference)
      mockDoc.mockReturnValue({} as DocumentReference)
      mockSetDoc.mockResolvedValue(undefined)

      const result = await firestoreService.createTeam(
        'Test Team',
        'Test Description',
        'user123',
        'test@example.com',
      )

      expect(result).toBe('team123')
      expect(mockAddDoc).toHaveBeenCalledWith(expect.any(Object), {
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'user123',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
      expect(mockSetDoc).toHaveBeenCalledTimes(3) // member + user-team mapping + addTeamMember call
    })

    it('handles errors during team creation', async () => {
      mockAddDoc.mockRejectedValue(new Error('Firestore error'))
      mockCollection.mockReturnValue({} as CollectionReference)

      await expect(
        firestoreService.createTeam(
          'Test Team',
          'Test Description',
          'user123',
          'test@example.com',
        ),
      ).rejects.toThrow('Firestore error')
    })
  })

  describe('getTeam', () => {
    it('returns team when exists', async () => {
      const mockTeamData = {
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'user123',
        createdAt: createMockTimestamp(new Date('2024-01-01')),
        updatedAt: createMockTimestamp(new Date('2024-01-01')),
      }

      const mockDocSnap = {
        exists: () => true,
        id: 'team123',
        data: () => mockTeamData,
      }

      mockDoc.mockReturnValue({} as DocumentReference)
      mockGetDoc.mockResolvedValue(mockDocSnap as unknown as DocumentSnapshot)

      const result = await firestoreService.getTeam('team123')

      expect(result).toEqual({
        id: 'team123',
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'user123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      })
    })

    it('returns null when team does not exist', async () => {
      const mockDocSnap = {
        exists: () => false,
      }

      mockDoc.mockReturnValue({} as DocumentReference)
      mockGetDoc.mockResolvedValue(mockDocSnap as unknown as DocumentSnapshot)

      const result = await firestoreService.getTeam('team123')

      expect(result).toBeNull()
    })

    it('handles missing timestamp fields', async () => {
      const mockTeamData = {
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'user123',
        // Missing createdAt and updatedAt
      }

      const mockDocSnap = {
        exists: () => true,
        id: 'team123',
        data: () => mockTeamData,
      }

      mockDoc.mockReturnValue({} as DocumentReference)
      mockGetDoc.mockResolvedValue(mockDocSnap as unknown as DocumentSnapshot)

      const result = await firestoreService.getTeam('team123')

      expect(result).toEqual({
        id: 'team123',
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'user123',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
    })
  })

  describe('updateTeam', () => {
    it('updates team successfully', async () => {
      mockDoc.mockReturnValue({} as DocumentReference)
      mockUpdateDoc.mockResolvedValue(undefined)

      await firestoreService.updateTeam('team123', {
        name: 'Updated Team',
        description: 'Updated Description',
      })

      expect(mockUpdateDoc).toHaveBeenCalledWith(expect.any(Object), {
        name: 'Updated Team',
        description: 'Updated Description',
        updatedAt: expect.any(Date),
      })
    })

    it('handles partial updates', async () => {
      mockDoc.mockReturnValue({} as DocumentReference)
      mockUpdateDoc.mockResolvedValue(undefined)

      await firestoreService.updateTeam('team123', {
        name: 'Updated Team',
      })

      expect(mockUpdateDoc).toHaveBeenCalledWith(expect.any(Object), {
        name: 'Updated Team',
        updatedAt: expect.any(Date),
      })
    })
  })

  describe('deleteTeam', () => {
    it('deletes team and all related data', async () => {
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn(),
      }
      const mockMembersSnapshot = {
        docs: [{ ref: { id: 'member1' } }, { ref: { id: 'member2' } }],
      }
      const mockUsersSnapshot = {
        docs: [{ ref: { id: 'user1' } }],
      }

      mockWriteBatch.mockReturnValue(mockBatch as unknown as WriteBatch)
      mockDoc.mockReturnValue({} as DocumentReference)
      mockCollection.mockReturnValue({} as CollectionReference)
      mockQuery.mockReturnValue({} as Query)
      mockGetDocs
        .mockResolvedValueOnce(mockMembersSnapshot as unknown as QuerySnapshot)
        .mockResolvedValueOnce(mockUsersSnapshot as unknown as QuerySnapshot)

      await firestoreService.deleteTeam('team123')

      // Should delete: team + 2 members + 1 user + subscription
      expect(mockBatch.delete).toHaveBeenCalledTimes(5)
      expect(mockBatch.commit).toHaveBeenCalled()
    })

    it('handles empty collections during deletion', async () => {
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn(),
      }
      const mockEmptySnapshot = {
        docs: [],
      }

      mockWriteBatch.mockReturnValue(mockBatch as unknown as WriteBatch)
      mockDoc.mockReturnValue({} as DocumentReference)
      mockCollection.mockReturnValue({} as CollectionReference)
      mockQuery.mockReturnValue({} as Query)
      mockGetDocs.mockResolvedValue(
        mockEmptySnapshot as unknown as QuerySnapshot,
      )

      await firestoreService.deleteTeam('team123')

      // Should delete: team + subscription (no members/users)
      expect(mockBatch.delete).toHaveBeenCalledTimes(2)
      expect(mockBatch.commit).toHaveBeenCalled()
    })
  })

  describe('addTeamMember', () => {
    it('adds team member successfully', async () => {
      mockDoc.mockReturnValue({} as DocumentReference)
      mockSetDoc.mockResolvedValue(undefined)

      await firestoreService.addTeamMember(
        'team123',
        'user123',
        'member',
        'owner123',
        'test@example.com',
      )

      expect(mockSetDoc).toHaveBeenCalledTimes(2)
      expect(mockSetDoc).toHaveBeenCalledWith(expect.any(Object), {
        email: 'test@example.com',
        role: 'member',
        joinedAt: expect.any(Date),
        invitedBy: 'owner123',
      })
    })

    it('adds team member without email', async () => {
      mockDoc.mockReturnValue({} as DocumentReference)
      mockSetDoc.mockResolvedValue(undefined)

      await firestoreService.addTeamMember(
        'team123',
        'user123',
        'member',
        'owner123',
      )

      expect(mockSetDoc).toHaveBeenCalledWith(expect.any(Object), {
        email: '',
        role: 'member',
        joinedAt: expect.any(Date),
        invitedBy: 'owner123',
      })
    })
  })

  describe('getTeamMembers', () => {
    it('returns team members ordered by joined date', async () => {
      const mockMembersData = [
        {
          id: 'member1',
          data: () => ({
            email: 'member1@example.com',
            role: 'member',
            joinedAt: createMockTimestamp(new Date('2024-01-01')),
            invitedBy: 'owner123',
          }),
        },
        {
          id: 'member2',
          data: () => ({
            email: 'member2@example.com',
            role: 'admin',
            joinedAt: createMockTimestamp(new Date('2024-01-02')),
            invitedBy: 'owner123',
          }),
        },
      ]

      mockCollection.mockReturnValue({} as CollectionReference)
      mockOrderBy.mockReturnValue({} as QueryOrderByConstraint)
      mockQuery.mockReturnValue({} as Query)
      mockGetDocs.mockResolvedValue({
        docs: mockMembersData,
      } as unknown as QuerySnapshot)

      const result = await firestoreService.getTeamMembers('team123')

      expect(result).toEqual([
        {
          id: 'member1',
          email: 'member1@example.com',
          role: 'member',
          joinedAt: new Date('2024-01-01'),
          invitedBy: 'owner123',
        },
        {
          id: 'member2',
          email: 'member2@example.com',
          role: 'admin',
          joinedAt: new Date('2024-01-02'),
          invitedBy: 'owner123',
        },
      ])
      expect(mockOrderBy).toHaveBeenCalledWith('joinedAt', 'desc')
    })

    it('returns empty array when no members', async () => {
      mockCollection.mockReturnValue({} as CollectionReference)
      mockOrderBy.mockReturnValue({} as QueryOrderByConstraint)
      mockQuery.mockReturnValue({} as Query)
      mockGetDocs.mockResolvedValue({
        docs: [],
      } as unknown as QuerySnapshot)

      const result = await firestoreService.getTeamMembers('team123')

      expect(result).toEqual([])
    })
  })

  describe('updateTeamMemberRole', () => {
    it('updates team member role', async () => {
      mockDoc.mockReturnValue({} as DocumentReference)
      mockUpdateDoc.mockResolvedValue(undefined)

      await firestoreService.updateTeamMemberRole(
        'team123',
        'member123',
        'admin',
      )

      expect(mockUpdateDoc).toHaveBeenCalledWith(expect.any(Object), {
        role: 'admin',
      })
    })
  })

  describe('removeTeamMember', () => {
    it('removes team member and related data', async () => {
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn(),
      }

      mockWriteBatch.mockReturnValue(mockBatch as unknown as WriteBatch)
      mockDoc.mockReturnValue({} as DocumentReference)

      await firestoreService.removeTeamMember('team123', 'member123')

      expect(mockBatch.delete).toHaveBeenCalledTimes(3) // member + user + user-team mapping
      expect(mockBatch.commit).toHaveBeenCalled()
    })
  })

  describe('createTeamInvitation', () => {
    it('creates team invitation with 7-day expiration', async () => {
      const mockDocRef = { id: 'invitation123' } as DocumentReference

      mockAddDoc.mockResolvedValue(mockDocRef)
      mockCollection.mockReturnValue({} as CollectionReference)

      // Mock getDoc to return a valid document snapshot for getTeam
      const mockDocSnap = {
        exists: () => true,
        data: () => ({
          name: 'Test Team',
          description: 'Test Description',
          ownerId: 'owner123',
          createdAt: createMockTimestamp(new Date('2024-01-01')),
          updatedAt: createMockTimestamp(new Date('2024-01-01')),
        }),
      }
      mockGetDoc.mockResolvedValue(mockDocSnap as unknown as DocumentSnapshot)

      const result = await firestoreService.createTeamInvitation(
        'team123',
        'test@example.com',
        'member',
        'owner123',
      )

      expect(result).toBe('invitation123')
      expect(mockAddDoc).toHaveBeenCalledWith(expect.any(Object), {
        teamId: 'team123',
        email: 'test@example.com',
        role: 'member',
        invitedBy: 'owner123',
        invitedAt: expect.any(Date),
        expiresAt: expect.any(Object), // Timestamp
        status: 'pending',
      })
      expect(mockSendTeamInvitationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'invitation123',
          teamId: 'team123',
          email: 'test@example.com',
          role: 'member',
          invitedBy: 'owner123',
          status: 'pending',
        }),
        'Test Team',
        'owner123',
      )
    })

    it('handles invitation creation errors', async () => {
      mockAddDoc.mockRejectedValue(new Error('Invitation creation failed'))
      mockCollection.mockReturnValue({} as CollectionReference)

      await expect(
        firestoreService.createTeamInvitation(
          'team123',
          'test@example.com',
          'member',
          'owner123',
        ),
      ).rejects.toThrow('Invitation creation failed')
    })

    it('handles Firebase permission denied errors', async () => {
      mockAddDoc.mockRejectedValue(
        new FirestoreError('permission-denied', 'Permission denied'),
      )
      mockCollection.mockReturnValue({} as CollectionReference)

      await expect(
        firestoreService.createTeamInvitation(
          'team123',
          'test@example.com',
          'member',
          'owner123',
        ),
      ).rejects.toThrow('Permission denied')
    })

    it('handles Firebase team not found errors', async () => {
      mockAddDoc.mockRejectedValue(
        new FirestoreError('not-found', 'Team not found'),
      )
      mockCollection.mockReturnValue({} as CollectionReference)

      await expect(
        firestoreService.createTeamInvitation(
          'team123',
          'test@example.com',
          'member',
          'owner123',
        ),
      ).rejects.toThrow('Team not found')
    })

    it('handles email sending errors', async () => {
      const mockDocRef = { id: 'invitation123' } as DocumentReference

      mockAddDoc.mockResolvedValue(mockDocRef)
      mockCollection.mockReturnValue({} as CollectionReference)

      // Mock getDoc to return a valid document snapshot for getTeam
      const mockDocSnap = {
        exists: () => true,
        data: () => ({
          name: 'Test Team',
          description: 'Test Description',
          ownerId: 'owner123',
          createdAt: createMockTimestamp(new Date('2024-01-01')),
          updatedAt: createMockTimestamp(new Date('2024-01-01')),
        }),
      }
      mockGetDoc.mockResolvedValue(mockDocSnap as unknown as DocumentSnapshot)

      mockSendTeamInvitationEmail.mockRejectedValue(
        new Error('Email sending failed'),
      )

      await expect(
        firestoreService.createTeamInvitation(
          'team123',
          'test@example.com',
          'member',
          'owner123',
        ),
      ).rejects.toThrow('Email sending failed')
    })
  })

  describe('getTeamInvitations', () => {
    it('returns pending team invitations', async () => {
      const mockInvitationsData = [
        {
          id: 'invitation1',
          data: () => ({
            teamId: 'team123',
            email: 'test1@example.com',
            role: 'member',
            invitedBy: 'owner123',
            invitedAt: createMockTimestamp(new Date('2024-01-01')),
            expiresAt: createMockTimestamp(new Date('2024-01-08')),
            status: 'pending',
          }),
        },
        {
          id: 'invitation2',
          data: () => ({
            teamId: 'team123',
            email: 'test2@example.com',
            role: 'admin',
            invitedBy: 'owner123',
            invitedAt: createMockTimestamp(new Date('2024-01-02')),
            expiresAt: createMockTimestamp(new Date('2024-01-09')),
            status: 'pending',
          }),
        },
      ]

      mockCollection.mockReturnValue({} as CollectionReference)
      mockWhere.mockReturnValue({} as QueryFieldFilterConstraint)
      mockOrderBy.mockReturnValue({} as QueryOrderByConstraint)
      mockQuery.mockReturnValue({} as Query)
      mockGetDocs.mockResolvedValue({
        docs: mockInvitationsData,
      } as unknown as QuerySnapshot)

      const result = await firestoreService.getTeamInvitations('team123')

      expect(result).toEqual([
        {
          id: 'invitation1',
          teamId: 'team123',
          email: 'test1@example.com',
          role: 'member',
          invitedBy: 'owner123',
          invitedAt: new Date('2024-01-01'),
          expiresAt: new Date('2024-01-08'),
          status: 'pending',
        },
        {
          id: 'invitation2',
          teamId: 'team123',
          email: 'test2@example.com',
          role: 'admin',
          invitedBy: 'owner123',
          invitedAt: new Date('2024-01-02'),
          expiresAt: new Date('2024-01-09'),
          status: 'pending',
        },
      ])
      expect(mockWhere).toHaveBeenCalledWith('teamId', '==', 'team123')
      expect(mockWhere).toHaveBeenCalledWith('status', '==', 'pending')
    })
  })

  describe('getUserInvitations', () => {
    it('returns pending invitations for user email', async () => {
      const mockInvitationsData = [
        {
          id: 'invitation1',
          data: () => ({
            teamId: 'team123',
            email: 'test@example.com',
            role: 'member',
            invitedBy: 'owner123',
            invitedAt: createMockTimestamp(new Date('2024-01-01')),
            expiresAt: createMockTimestamp(new Date('2024-01-08')),
            status: 'pending',
          }),
        },
      ]

      mockCollection.mockReturnValue({} as CollectionReference)
      mockWhere.mockReturnValue({} as QueryFieldFilterConstraint)
      mockOrderBy.mockReturnValue({} as QueryOrderByConstraint)
      mockQuery.mockReturnValue({} as Query)
      mockGetDocs.mockResolvedValue({
        docs: mockInvitationsData,
      } as unknown as QuerySnapshot)

      const result =
        await firestoreService.getUserInvitations('test@example.com')

      expect(result).toEqual([
        {
          id: 'invitation1',
          teamId: 'team123',
          email: 'test@example.com',
          role: 'member',
          invitedBy: 'owner123',
          invitedAt: new Date('2024-01-01'),
          expiresAt: new Date('2024-01-08'),
          status: 'pending',
        },
      ])
      expect(mockWhere).toHaveBeenCalledWith('email', '==', 'test@example.com')
      expect(mockWhere).toHaveBeenCalledWith('status', '==', 'pending')
    })
  })

  describe('getTeamInvitation', () => {
    it('returns invitation by ID', async () => {
      const mockInvitationData = {
        teamId: 'team123',
        email: 'test@example.com',
        role: 'member',
        invitedBy: 'owner123',
        invitedAt: createMockTimestamp(new Date('2024-01-01')),
        expiresAt: createMockTimestamp(new Date('2024-01-08')),
        status: 'pending',
      }

      const mockDocSnap = {
        exists: () => true,
        id: 'invitation123',
        data: () => mockInvitationData,
      }

      mockDoc.mockReturnValue({} as DocumentReference)
      mockGetDoc.mockResolvedValue(mockDocSnap as unknown as DocumentSnapshot)

      const result = await firestoreService.getTeamInvitation('invitation123')

      expect(result).toEqual({
        id: 'invitation123',
        teamId: 'team123',
        email: 'test@example.com',
        role: 'member',
        invitedBy: 'owner123',
        invitedAt: new Date('2024-01-01'),
        expiresAt: new Date('2024-01-08'),
        status: 'pending',
      })
      expect(mockDoc).toHaveBeenCalledWith(
        expect.any(Object),
        'team-invitations',
        'invitation123',
      )
    })

    it('returns null when invitation not found', async () => {
      const mockDocSnap = {
        exists: () => false,
      }

      mockDoc.mockReturnValue({} as DocumentReference)
      mockGetDoc.mockResolvedValue(mockDocSnap as unknown as DocumentSnapshot)

      const result = await firestoreService.getTeamInvitation('nonexistent')

      expect(result).toBeNull()
    })

    it('handles Firebase errors', async () => {
      mockDoc.mockReturnValue({} as DocumentReference)
      mockGetDoc.mockRejectedValue(
        new FirestoreError('permission-denied', 'Permission denied'),
      )

      await expect(
        firestoreService.getTeamInvitation('invitation123'),
      ).rejects.toThrow(
        'You do not have permission to perform this action. Please check your authentication.',
      )
    })
  })

  describe('acceptTeamInvitation', () => {
    it('accepts invitation and adds user to team', async () => {
      const mockInvitationData = {
        teamId: 'team123',
        role: 'member',
        invitedBy: 'owner123',
      }

      const mockInvitationSnap = {
        exists: () => true,
        data: () => mockInvitationData,
      }

      const mockBatch = {
        update: jest.fn(),
        set: jest.fn(),
        commit: jest.fn(),
      }

      mockDoc.mockReturnValue({} as DocumentReference)
      mockGetDoc.mockResolvedValue(
        mockInvitationSnap as unknown as DocumentSnapshot,
      )
      mockWriteBatch.mockReturnValue(mockBatch as unknown as WriteBatch)
      mockSetDoc.mockResolvedValue(undefined)

      await firestoreService.acceptTeamInvitation(
        'invitation123',
        'user123',
        'test@example.com',
      )

      expect(mockBatch.update).toHaveBeenCalledWith(expect.any(Object), {
        status: 'accepted',
      })
      expect(mockBatch.set).toHaveBeenCalledWith(expect.any(Object), {
        teamId: 'team123',
        role: 'member',
        joinedAt: expect.any(Date),
      })
      expect(mockBatch.commit).toHaveBeenCalled()
    })

    it('throws error when invitation not found', async () => {
      const mockInvitationSnap = {
        exists: () => false,
      }

      mockDoc.mockReturnValue({} as DocumentReference)
      mockGetDoc.mockResolvedValue(
        mockInvitationSnap as unknown as DocumentSnapshot,
      )

      await expect(
        firestoreService.acceptTeamInvitation(
          'invitation123',
          'user123',
          'test@example.com',
        ),
      ).rejects.toThrow('Invitation not found')
    })
  })

  describe('declineTeamInvitation', () => {
    it('declines invitation by setting status to expired', async () => {
      mockDoc.mockReturnValue({} as DocumentReference)
      mockUpdateDoc.mockResolvedValue(undefined)

      await firestoreService.declineTeamInvitation('invitation123')

      expect(mockUpdateDoc).toHaveBeenCalledWith(expect.any(Object), {
        status: 'expired',
      })
    })
  })

  describe('getUserTeam', () => {
    it('returns user team from user-teams mapping', async () => {
      const mockUserTeamData = {
        teamId: 'team123',
        role: 'member',
        joinedAt: createMockTimestamp(new Date('2024-01-01')),
      }

      const mockTeamData = {
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'owner123',
        createdAt: createMockTimestamp(new Date('2024-01-01')),
        updatedAt: createMockTimestamp(new Date('2024-01-01')),
      }

      const mockUserTeamSnap = {
        exists: () => true,
        data: () => mockUserTeamData,
      }

      const mockTeamSnap = {
        exists: () => true,
        id: 'team123',
        data: () => mockTeamData,
      }

      mockDoc.mockReturnValue({} as DocumentReference)
      mockGetDoc
        .mockResolvedValueOnce(mockUserTeamSnap as unknown as DocumentSnapshot)
        .mockResolvedValueOnce(mockTeamSnap as unknown as DocumentSnapshot)

      const result = await firestoreService.getUserTeam('user123')

      expect(result).toEqual({
        id: 'team123',
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'owner123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      })
    })

    it('returns null when user has no team mapping', async () => {
      const mockUserTeamSnap = {
        exists: () => false,
      }

      const mockQuerySnapshot = {
        empty: true,
        docs: [],
      }

      mockDoc.mockReturnValue({} as DocumentReference)
      mockGetDoc.mockResolvedValue(
        mockUserTeamSnap as unknown as DocumentSnapshot,
      )
      mockCollection.mockReturnValue({} as CollectionReference)
      mockWhere.mockReturnValue({} as QueryFieldFilterConstraint)
      mockQuery.mockReturnValue({} as Query)
      mockGetDocs.mockResolvedValue(
        mockQuerySnapshot as unknown as QuerySnapshot,
      )

      const result = await firestoreService.getUserTeam('user123')

      expect(result).toBeNull()
    })

    it('handles errors gracefully', async () => {
      mockDoc.mockReturnValue({} as DocumentReference)
      mockGetDoc.mockRejectedValue(new Error('Firestore error'))

      await expect(firestoreService.getUserTeam('user123')).rejects.toThrow(
        'Failed to fetch team data: Firestore error',
      )
    })

    it('handles Firebase permission denied errors', async () => {
      mockDoc.mockReturnValue({} as DocumentReference)
      mockGetDoc.mockRejectedValue(
        new FirestoreError('permission-denied', 'Permission denied'),
      )

      await expect(firestoreService.getUserTeam('user123')).rejects.toThrow(
        'Failed to fetch team data: Permission denied',
      )
    })

    it('handles Firebase team not found errors', async () => {
      mockDoc.mockReturnValue({} as DocumentReference)
      mockGetDoc.mockRejectedValue(
        new FirestoreError('not-found', 'Team not found'),
      )

      await expect(firestoreService.getUserTeam('user123')).rejects.toThrow(
        'Failed to fetch team data: Team not found',
      )
    })
  })

  describe('getTeamSubscription', () => {
    it('returns team subscription when exists', async () => {
      const mockSubscriptionData = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active',
        currentPeriodStart: createMockTimestamp(new Date('2024-01-01')),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        quantity: 5,
        updatedAt: createMockTimestamp(new Date('2024-01-01')),
        planName: 'Team Plan',
        planDescription: 'Team subscription',
      }

      const mockDocSnap = {
        exists: () => true,
        data: () => mockSubscriptionData,
      }

      mockDoc.mockReturnValue({} as DocumentReference)
      mockGetDoc.mockResolvedValue(mockDocSnap as unknown as DocumentSnapshot)

      const result = await firestoreService.getTeamSubscription('team123')

      expect(result).toEqual({
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active',
        currentPeriodStart: new Date('2024-01-01'),
        cancelAt: undefined,
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        quantity: 5,
        updatedAt: new Date('2024-01-01'),
        planName: 'Team Plan',
        planDescription: 'Team subscription',
      })
    })

    it('returns null when subscription does not exist', async () => {
      const mockDocSnap = {
        exists: () => false,
      }

      mockDoc.mockReturnValue({} as DocumentReference)
      mockGetDoc.mockResolvedValue(mockDocSnap as unknown as DocumentSnapshot)

      const result = await firestoreService.getTeamSubscription('team123')

      expect(result).toBeNull()
    })
  })

  describe('onTeamMembersChange', () => {
    it('sets up real-time listener for team members', () => {
      const mockUnsubscribe = jest.fn()
      mockOnSnapshot.mockReturnValue(mockUnsubscribe)
      mockCollection.mockReturnValue({} as CollectionReference)
      mockOrderBy.mockReturnValue({} as QueryOrderByConstraint)
      mockQuery.mockReturnValue({} as Query)

      const callback = jest.fn()
      const unsubscribe = firestoreService.onTeamMembersChange(
        'team123',
        callback,
      )

      expect(mockOnSnapshot).toHaveBeenCalled()
      expect(unsubscribe).toBe(mockUnsubscribe)
    })

    it('calls callback with formatted members data', () => {
      const mockUnsubscribe = jest.fn()
      const mockCallback = jest.fn()

      mockOnSnapshot.mockImplementation((query, callback: any) => {
        // Simulate snapshot callback
        const mockSnapshot = {
          docs: [
            {
              id: 'member1',
              data: () => ({
                email: 'test@example.com',
                role: 'member',
                joinedAt: createMockTimestamp(new Date('2024-01-01')),
                invitedBy: 'owner123',
              }),
            },
          ],
        }
        callback(mockSnapshot)
        return mockUnsubscribe
      })

      mockCollection.mockReturnValue({} as CollectionReference)
      mockOrderBy.mockReturnValue({} as QueryOrderByConstraint)
      mockQuery.mockReturnValue({} as Query)

      firestoreService.onTeamMembersChange('team123', mockCallback)

      expect(mockCallback).toHaveBeenCalledWith([
        {
          id: 'member1',
          email: 'test@example.com',
          role: 'member',
          joinedAt: new Date('2024-01-01'),
          invitedBy: 'owner123',
        },
      ])
    })
  })

  describe('onTeamSubscriptionChange', () => {
    it('sets up real-time listener for team subscription', () => {
      const mockUnsubscribe = jest.fn()
      mockOnSnapshot.mockReturnValue(mockUnsubscribe)
      mockDoc.mockReturnValue({} as DocumentReference)

      const callback = jest.fn()
      const unsubscribe = firestoreService.onTeamSubscriptionChange(
        'team123',
        callback,
      )

      expect(mockOnSnapshot).toHaveBeenCalled()
      expect(unsubscribe).toBe(mockUnsubscribe)
    })

    it('calls callback with null when subscription does not exist', () => {
      const mockUnsubscribe = jest.fn()
      const mockCallback = jest.fn()

      mockOnSnapshot.mockImplementation((doc, callback: any) => {
        // Simulate snapshot callback with non-existent document
        const mockDocSnap = {
          exists: () => false,
        }
        callback(mockDocSnap)
        return mockUnsubscribe
      })

      mockDoc.mockReturnValue({} as DocumentReference)

      firestoreService.onTeamSubscriptionChange('team123', mockCallback)

      expect(mockCallback).toHaveBeenCalledWith(null)
    })

    it('calls callback with formatted subscription data', () => {
      const mockUnsubscribe = jest.fn()
      const mockCallback = jest.fn()

      mockOnSnapshot.mockImplementation((doc, callback: any) => {
        // Simulate snapshot callback with existing document
        const mockDocSnap = {
          exists: () => true,
          data: () => ({
            stripeSubscriptionId: 'sub_123',
            stripeCustomerId: 'cus_123',
            status: 'active',
            currentPeriodStart: createMockTimestamp(new Date('2024-01-01')),
            cancelAtPeriodEnd: false,
            priceId: 'price_123',
            quantity: 5,
            updatedAt: createMockTimestamp(new Date('2024-01-01')),
            planName: 'Team Plan',
            planDescription: 'Team subscription',
          }),
        }
        callback(mockDocSnap)
        return mockUnsubscribe
      })

      mockDoc.mockReturnValue({} as DocumentReference)

      firestoreService.onTeamSubscriptionChange('team123', mockCallback)

      expect(mockCallback).toHaveBeenCalledWith({
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active',
        currentPeriodStart: new Date('2024-01-01'),
        cancelAt: undefined,
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        quantity: 5,
        updatedAt: new Date('2024-01-01'),
        planName: 'Team Plan',
        planDescription: 'Team subscription',
      })
    })
  })
})
