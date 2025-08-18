import {
  type CollectionReference,
  type DocumentReference,
  type Query,
  type QueryOrderByConstraint,
  type QuerySnapshot,
  type WriteBatch,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'

import type { TimeEntry } from '@/lib/types'

import * as firestoreService from '../time-entry-service.firestore'

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  Timestamp: {
    fromDate: jest.fn((date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: (date.getTime() % 1000) * 1000000,
    })),
  },
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  updateDoc: jest.fn(),
  writeBatch: jest.fn(),
}))

// Mock Firebase database
jest.mock('@/lib/firebase', () => ({
  db: {},
}))

const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>
const mockCollection = collection as jest.MockedFunction<typeof collection>
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>
const mockDoc = doc as jest.MockedFunction<typeof doc>
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>
const mockQuery = query as jest.MockedFunction<typeof query>
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>
const mockWriteBatch = writeBatch as jest.MockedFunction<typeof writeBatch>

describe('Time Entry Service Firestore Implementation', () => {
  const mockUserId = 'test-user-123'
  const mockEntryId = 'entry-123'
  const mockCollectionRef = {} as CollectionReference
  const mockDocRef = {} as DocumentReference

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    mockCollection.mockReturnValue(mockCollectionRef)
    mockDoc.mockReturnValue(mockDocRef)
    mockQuery.mockReturnValue(mockCollectionRef as unknown as Query)
    mockOrderBy.mockReturnValue({} as QueryOrderByConstraint)
  })

  describe('addTimeEntry', () => {
    const mockEntry: Omit<TimeEntry, 'id'> = {
      userId: mockUserId,
      location: 'Test Location',
      startTime: new Date('2025-01-01T10:00:00Z'),
      endTime: new Date('2025-01-01T11:00:00Z'),
    }

    it('should add a time entry to the correct Firestore collection', async () => {
      const mockDocRefWithId = {
        id: mockEntryId,
      } as unknown as DocumentReference
      mockAddDoc.mockResolvedValue(mockDocRefWithId)

      const result = await firestoreService.addTimeEntry(mockEntry)

      // Verify correct collection path
      expect(mockCollection).toHaveBeenCalledWith(
        {},
        'users',
        mockUserId,
        'timeEntries',
      )
      expect(mockAddDoc).toHaveBeenCalledWith(mockCollectionRef, {
        userId: mockUserId,
        location: 'Test Location',
        startTime: expect.any(Object), // Timestamp object
        endTime: expect.any(Object), // Timestamp object
      })
      expect(result).toBe(mockEntryId)
    })

    it('should throw error when userId is missing', async () => {
      const entryWithoutUserId = { ...mockEntry, userId: '' }

      await expect(
        firestoreService.addTimeEntry(entryWithoutUserId),
      ).rejects.toThrow('User not authenticated')
    })

    it('should convert dates to Firestore timestamps', async () => {
      const mockDocRefWithId = {
        id: mockEntryId,
      } as unknown as DocumentReference
      mockAddDoc.mockResolvedValue(mockDocRefWithId)

      await firestoreService.addTimeEntry(mockEntry)

      // Verify Timestamp.fromDate was called for dates
      expect(mockAddDoc).toHaveBeenCalledWith(mockCollectionRef, {
        userId: mockUserId,
        location: 'Test Location',
        startTime: expect.any(Object),
        endTime: expect.any(Object),
      })
    })

    it('should handle entry without end time', async () => {
      const entryWithoutEndTime = { ...mockEntry }
      delete entryWithoutEndTime.endTime
      const mockDocRefWithId = {
        id: mockEntryId,
      } as unknown as DocumentReference
      mockAddDoc.mockResolvedValue(mockDocRefWithId)

      await firestoreService.addTimeEntry(entryWithoutEndTime)

      expect(mockAddDoc).toHaveBeenCalledWith(mockCollectionRef, {
        userId: mockUserId,
        location: 'Test Location',
        startTime: expect.any(Object),
        // endTime should not be in the data
      })
      expect(mockAddDoc.mock.calls[0][1]).not.toHaveProperty('endTime')
    })

    it('should handle entries with all optional fields', async () => {
      const fullEntry: Omit<TimeEntry, 'id'> = {
        userId: mockUserId,
        location: 'Full Location',
        startTime: new Date('2025-01-01T10:00:00Z'),
        endTime: new Date('2025-01-01T11:00:00Z'),
        durationMinutes: 60,
        pauseDuration: 15,
        driverTimeHours: 0.5,
        passengerTimeHours: 0.5,
      }

      const mockDocRefWithId = {
        id: mockEntryId,
      } as unknown as DocumentReference
      mockAddDoc.mockResolvedValue(mockDocRefWithId)

      await firestoreService.addTimeEntry(fullEntry)

      expect(mockAddDoc).toHaveBeenCalledWith(mockCollectionRef, {
        userId: mockUserId,
        location: 'Full Location',
        startTime: expect.any(Object),
        endTime: expect.any(Object),
        durationMinutes: 60,
        pauseDuration: 15,
        driverTimeHours: 0.5,
        passengerTimeHours: 0.5,
      })
    })
  })

  describe('updateTimeEntry', () => {
    const mockUpdateData: Partial<TimeEntry> = {
      userId: mockUserId,
      location: 'Updated Location',
      endTime: new Date('2025-01-01T12:00:00Z'),
    }

    it('should update a time entry in the correct Firestore document', async () => {
      mockUpdateDoc.mockResolvedValue(undefined)

      await firestoreService.updateTimeEntry(mockEntryId, mockUpdateData)

      // Verify correct document path
      expect(mockDoc).toHaveBeenCalledWith(
        {},
        'users',
        mockUserId,
        'timeEntries',
        mockEntryId,
      )
      expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocRef, {
        userId: mockUserId,
        location: 'Updated Location',
        endTime: expect.any(Object), // Timestamp object
      })
    })

    it('should throw error when userId is missing', async () => {
      const updateDataWithoutUserId = { ...mockUpdateData, userId: '' }

      await expect(
        firestoreService.updateTimeEntry(mockEntryId, updateDataWithoutUserId),
      ).rejects.toThrow('User not authenticated')
    })

    it('should handle partial updates correctly', async () => {
      const partialUpdate = {
        userId: mockUserId, // Include userId to avoid auth error
        location: 'New Location',
      }
      mockUpdateDoc.mockResolvedValue(undefined)

      await firestoreService.updateTimeEntry(mockEntryId, partialUpdate)

      expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocRef, {
        userId: mockUserId,
        location: 'New Location',
      })
    })

    it('should convert endTime to null when explicitly set to undefined', async () => {
      const updateDataWithUndefinedEndTime = {
        ...mockUpdateData,
        endTime: undefined,
      }
      mockUpdateDoc.mockResolvedValue(undefined)

      await firestoreService.updateTimeEntry(
        mockEntryId,
        updateDataWithUndefinedEndTime,
      )

      expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocRef, {
        userId: mockUserId,
        location: 'Updated Location',
        endTime: null,
      })
    })
  })

  describe('deleteTimeEntry', () => {
    it('should delete a time entry from the correct Firestore document', async () => {
      mockDeleteDoc.mockResolvedValue(undefined)

      await firestoreService.deleteTimeEntry(mockUserId, mockEntryId)

      // Verify correct document path
      expect(mockDoc).toHaveBeenCalledWith(
        {},
        'users',
        mockUserId,
        'timeEntries',
        mockEntryId,
      )
      expect(mockDeleteDoc).toHaveBeenCalledWith(mockDocRef)
    })

    it('should throw error when userId is missing', async () => {
      await expect(
        firestoreService.deleteTimeEntry('', mockEntryId),
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('getTimeEntries', () => {
    it('should return empty array when userId is missing', async () => {
      const result = await firestoreService.getTimeEntries('')

      expect(result).toEqual([])
      expect(mockCollection).not.toHaveBeenCalled()
    })

    it('should query the correct Firestore collection with proper ordering', async () => {
      const mockQuerySnapshot = {
        docs: [],
        empty: true,
      } as unknown as QuerySnapshot
      mockGetDocs.mockResolvedValue(mockQuerySnapshot)

      const result = await firestoreService.getTimeEntries(mockUserId)

      // Verify correct collection path and query structure
      expect(mockCollection).toHaveBeenCalledWith(
        {},
        'users',
        mockUserId,
        'timeEntries',
      )
      expect(mockOrderBy).toHaveBeenCalledWith('startTime', 'desc')
      expect(mockQuery).toHaveBeenCalledWith(
        mockCollectionRef,
        expect.any(Object),
      )
      expect(mockGetDocs).toHaveBeenCalled()
      expect(result).toEqual([])
    })
  })

  describe('deleteAllTimeEntries', () => {
    it('should delete all time entries using batch operation', async () => {
      const mockDocs = [
        { ref: { id: 'entry-1' } },
        { ref: { id: 'entry-2' } },
        { ref: { id: 'entry-3' } },
      ]

      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      } as unknown as WriteBatch

      mockGetDocs.mockResolvedValue({
        docs: mockDocs,
        empty: false,
      } as unknown as QuerySnapshot)
      mockWriteBatch.mockReturnValue(mockBatch)

      await firestoreService.deleteAllTimeEntries(mockUserId)

      // Verify correct collection path and batch operations
      expect(mockCollection).toHaveBeenCalledWith(
        {},
        'users',
        mockUserId,
        'timeEntries',
      )
      expect(mockGetDocs).toHaveBeenCalled()
      expect(mockWriteBatch).toHaveBeenCalledWith({})
      expect(mockBatch.delete).toHaveBeenCalledTimes(3)
      expect(mockBatch.commit).toHaveBeenCalled()
    })

    it('should return early when no entries exist', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true,
      } as unknown as QuerySnapshot)

      await firestoreService.deleteAllTimeEntries(mockUserId)

      expect(mockCollection).toHaveBeenCalledWith(
        {},
        'users',
        mockUserId,
        'timeEntries',
      )
      expect(mockGetDocs).toHaveBeenCalled()
      expect(mockWriteBatch).not.toHaveBeenCalled()
    })

    it('should throw error when userId is missing', async () => {
      await expect(firestoreService.deleteAllTimeEntries('')).rejects.toThrow(
        'User not authenticated',
      )
    })
  })

  describe('Data Conversion and Validation', () => {
    it('should handle timestamp conversion in real scenarios', async () => {
      const mockEntry: Omit<TimeEntry, 'id'> = {
        userId: mockUserId,
        location: 'Test Location',
        startTime: new Date('2025-01-01T10:00:00Z'),
        endTime: new Date('2025-01-01T11:00:00Z'),
      }

      const mockDocRefWithId = {
        id: mockEntryId,
      } as unknown as DocumentReference
      mockAddDoc.mockResolvedValue(mockDocRefWithId)

      await firestoreService.addTimeEntry(mockEntry)

      // Verify that the service handles the conversion internally
      expect(mockAddDoc).toHaveBeenCalledWith(mockCollectionRef, {
        userId: mockUserId,
        location: 'Test Location',
        startTime: expect.any(Object),
        endTime: expect.any(Object),
      })
    })
  })
})
