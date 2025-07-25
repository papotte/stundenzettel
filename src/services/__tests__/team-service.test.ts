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
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'

import * as teamService from '../team-service'

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
  updateDoc: jest.fn(),
  where: jest.fn(),
  writeBatch: jest.fn(),
}))

const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>
const mockCollection = collection as jest.MockedFunction<typeof collection>
const mockDoc = doc as jest.MockedFunction<typeof doc>
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>
const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>
const mockQuery = query as jest.MockedFunction<typeof query>
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>
const mockWhere = where as jest.MockedFunction<typeof where>
const mockWriteBatch = writeBatch as jest.MockedFunction<typeof writeBatch>

// Helper function to create mock Firestore timestamp
const createMockTimestamp = (date: Date) => ({
  toDate: () => date,
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: (date.getTime() % 1000) * 1000000,
})

describe('TeamService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createTeam', () => {
    it('creates team successfully', async () => {
      const mockDocRef = { id: 'team123' } as DocumentReference
      mockAddDoc.mockResolvedValue(mockDocRef)
      mockCollection.mockReturnValue({} as CollectionReference)
      mockDoc.mockReturnValue({} as DocumentReference)

      // Mock the user document that addTeamMember will try to access
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ email: 'test@example.com' }),
      } as unknown as DocumentSnapshot)

      const result = await teamService.createTeam(
        'Test Team',
        'Test Description',
        'user123',
      )

      expect(result).toBe('team123')
      expect(mockAddDoc).toHaveBeenCalledWith(expect.any(Object), {
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'user123',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
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

      const result = await teamService.getTeam('team123')

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

      const result = await teamService.getTeam('team123')

      expect(result).toBeNull()
    })
  })

  describe('updateTeam', () => {
    it('updates team successfully', async () => {
      mockDoc.mockReturnValue({} as DocumentReference)
      mockUpdateDoc.mockResolvedValue(undefined)

      await teamService.updateTeam('team123', {
        name: 'Updated Team',
        description: 'Updated Description',
      })

      expect(mockUpdateDoc).toHaveBeenCalledWith(expect.any(Object), {
        name: 'Updated Team',
        description: 'Updated Description',
        updatedAt: expect.any(Date),
      })
    })
  })

  describe('deleteTeam', () => {
    it('deletes team and related data', async () => {
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn(),
      }
      const mockQuerySnapshot = {
        docs: [{ ref: { id: 'member1' } }, { ref: { id: 'member2' } }],
      }

      mockWriteBatch.mockReturnValue(mockBatch as unknown as WriteBatch)
      mockDoc.mockReturnValue({} as DocumentReference)
      mockCollection.mockReturnValue({} as CollectionReference)
      mockQuery.mockReturnValue({} as Query)
      mockGetDocs.mockResolvedValue(
        mockQuerySnapshot as unknown as QuerySnapshot,
      )

      await teamService.deleteTeam('team123')

      const EXPECTED_DELETION_COUNT = 6 // team + 2 members + 2 users + subscription
      expect(mockBatch.delete).toHaveBeenCalledTimes(EXPECTED_DELETION_COUNT)
      expect(mockBatch.commit).toHaveBeenCalled()
    })
  })

  describe('addTeamMember', () => {
    it('adds team member successfully', async () => {
      const mockUserData = {
        email: 'test@example.com',
      }

      mockDoc.mockReturnValue({} as DocumentReference)
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      } as unknown as DocumentSnapshot)
      mockCollection.mockReturnValue({} as CollectionReference)
      mockAddDoc.mockResolvedValue({} as DocumentReference)

      await teamService.addTeamMember(
        'team123',
        'user123',
        'member',
        'owner123',
      )

      expect(mockAddDoc).toHaveBeenCalledWith(expect.any(Object), {
        email: 'test@example.com',
        role: 'member',
        joinedAt: expect.any(Date),
        invitedBy: 'owner123',
      })
    })
  })

  describe('getTeamMembers', () => {
    it('returns team members', async () => {
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

      const result = await teamService.getTeamMembers('team123')

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
    })
  })

  describe('updateTeamMemberRole', () => {
    it('updates team member role', async () => {
      mockDoc.mockReturnValue({} as DocumentReference)
      mockUpdateDoc.mockResolvedValue(undefined)

      await teamService.updateTeamMemberRole('team123', 'member123', 'admin')

      expect(mockUpdateDoc).toHaveBeenCalledWith(expect.any(Object), {
        role: 'admin',
      })
    })
  })

  describe('removeTeamMember', () => {
    it('removes team member', async () => {
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn(),
      }

      mockWriteBatch.mockReturnValue(mockBatch as unknown as WriteBatch)
      mockDoc.mockReturnValue({} as DocumentReference)

      await teamService.removeTeamMember('team123', 'member123')

      expect(mockBatch.delete).toHaveBeenCalledTimes(2) // member + user
      expect(mockBatch.commit).toHaveBeenCalled()
    })
  })

  describe('createTeamInvitation', () => {
    it('creates team invitation', async () => {
      const mockDocRef = { id: 'invitation123' } as DocumentReference
      mockAddDoc.mockResolvedValue(mockDocRef)
      mockCollection.mockReturnValue({} as CollectionReference)

      const result = await teamService.createTeamInvitation(
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
        expiresAt: expect.any(Date),
        status: 'pending',
      })
    })
  })

  describe('getUserTeam', () => {
    it('returns user team when exists', async () => {
      const mockTeamData = {
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'user123',
        createdAt: createMockTimestamp(new Date('2024-01-01')),
        updatedAt: createMockTimestamp(new Date('2024-01-01')),
      }

      const mockQuerySnapshot = {
        empty: false,
        docs: [
          {
            id: 'team123',
            data: () => mockTeamData,
          },
        ],
      }

      mockCollection.mockReturnValue({} as CollectionReference)
      mockWhere.mockReturnValue({} as QueryFieldFilterConstraint)
      mockQuery.mockReturnValue({} as Query)
      mockGetDocs.mockResolvedValue(
        mockQuerySnapshot as unknown as QuerySnapshot,
      )

      const result = await teamService.getUserTeam('user123')

      expect(result).toEqual({
        id: 'team123',
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'user123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      })
    })

    it('returns null when user has no team', async () => {
      const mockQuerySnapshot = {
        empty: true,
        docs: [],
      }

      mockCollection.mockReturnValue({} as CollectionReference)
      mockWhere.mockReturnValue({} as QueryFieldFilterConstraint)
      mockQuery.mockReturnValue({} as Query)
      mockGetDocs.mockResolvedValue(
        mockQuerySnapshot as unknown as QuerySnapshot,
      )

      const result = await teamService.getUserTeam('user123')

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
      const unsubscribe = teamService.onTeamMembersChange('team123', callback)

      expect(mockOnSnapshot).toHaveBeenCalled()
      expect(unsubscribe).toBe(mockUnsubscribe)
    })
  })

  describe('onTeamSubscriptionChange', () => {
    it('sets up real-time listener for team subscription', () => {
      const mockUnsubscribe = jest.fn()
      mockOnSnapshot.mockReturnValue(mockUnsubscribe)
      mockCollection.mockReturnValue({} as CollectionReference)
      mockDoc.mockReturnValue({} as DocumentReference)

      const callback = jest.fn()
      const unsubscribe = teamService.onTeamSubscriptionChange(
        'team123',
        callback,
      )

      expect(mockOnSnapshot).toHaveBeenCalled()
      expect(unsubscribe).toBe(mockUnsubscribe)
    })
  })
})
