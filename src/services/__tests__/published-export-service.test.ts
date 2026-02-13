import type { TimeEntry, UserSettings } from '@/lib/types'

import {
  getPublishedMonth,
  publishMonthForTeam,
  unpublishMonth,
} from '../published-export-service'

jest.mock('@/lib/firebase', () => ({
  db: {},
}))

const mockSetDoc = jest.fn()
const mockGetDoc = jest.fn()
const mockDeleteDoc = jest.fn()

jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  doc: jest.fn((...path: string[]) => ({ path })),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  Timestamp: {
    fromDate: (d: Date) => ({ toDate: () => d }),
  },
}))

const mockEntries: TimeEntry[] = [
  {
    id: 'e1',
    userId: 'user-1',
    startTime: new Date('2024-01-15T09:00:00'),
    endTime: new Date('2024-01-15T17:00:00'),
    location: 'Office',
  },
]

const mockUserSettings: UserSettings = {
  displayName: 'Test',
  expectedMonthlyHours: 160,
}

describe('published-export-service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('publishMonthForTeam', () => {
    it('writes snapshot to Firestore', async () => {
      await publishMonthForTeam(
        'team-1',
        'user-1',
        '2024-01',
        mockEntries,
        mockUserSettings,
      )

      expect(mockSetDoc).toHaveBeenCalledTimes(1)
      const [, data] = mockSetDoc.mock.calls[0]
      expect(data.publishedAt).toBeDefined()
      expect(data.entries).toHaveLength(1)
      expect(data.entries[0].location).toBe('Office')
      expect(data.userSettings).toEqual(mockUserSettings)
    })
  })

  describe('getPublishedMonth', () => {
    it('returns null when document does not exist', async () => {
      mockGetDoc.mockResolvedValue({ exists: () => false })

      const result = await getPublishedMonth('team-1', 'user-1', '2024-01')

      expect(result).toBeNull()
    })

    it('returns deserialized data when document exists', async () => {
      const publishedAt = new Date('2024-01-20')
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          publishedAt: { toDate: () => publishedAt },
          entries: [
            {
              id: 'e1',
              userId: 'user-1',
              startTime: { toDate: () => new Date('2024-01-15T09:00:00') },
              endTime: { toDate: () => new Date('2024-01-15T17:00:00') },
              location: 'Office',
            },
          ],
          userSettings: mockUserSettings,
        }),
      })

      const result = await getPublishedMonth('team-1', 'user-1', '2024-01')

      expect(result).not.toBeNull()
      expect(result!.publishedAt).toEqual(publishedAt)
      expect(result!.entries).toHaveLength(1)
      expect(result!.entries[0].userId).toBe('user-1')
      expect(result!.userSettings).toEqual(mockUserSettings)
    })
  })

  describe('unpublishMonth', () => {
    it('deletes the document', async () => {
      await unpublishMonth('team-1', 'user-1', '2024-01')

      expect(mockDeleteDoc).toHaveBeenCalledTimes(1)
    })
  })
})
