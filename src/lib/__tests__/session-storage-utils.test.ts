import {
  clearAllSessionStorage,
  exportSessionStorageData,
  getSessionStorageData,
  importSessionStorageData,
} from '../session-storage-utils'

// Mock sessionStorage
const mockSessionStorage: {
  data: Record<string, string>
  getItem: jest.Mock<string | null, [string]>
  setItem: jest.Mock<void, [string, string]>
  removeItem: jest.Mock<void, [string]>
  clear: jest.Mock<void, []>
} = {
  data: {} as Record<string, string>,
  getItem: jest.fn(
    (key: string): string | null => mockSessionStorage.data[key] || null,
  ),
  setItem: jest.fn((key: string, value: string): void => {
    mockSessionStorage.data[key] = value
  }),
  removeItem: jest.fn((key: string): void => {
    delete mockSessionStorage.data[key]
  }),
  clear: jest.fn((): void => {
    mockSessionStorage.data = {}
  }),
}

// Mock window object
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
})

describe('Session Storage Utils', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    mockSessionStorage.clear()
    jest.clearAllMocks()
  })

  describe('clearAllSessionStorage', () => {
    it('should clear all session storage keys', () => {
      // Set up some test data
      mockSessionStorage.setItem('timewise_local_teams', '{"test": "data"}')
      mockSessionStorage.setItem('timewise_local_members', '{"test": "data"}')
      mockSessionStorage.setItem('other_key', 'should not be removed')

      clearAllSessionStorage()

      // Check that TimeWise keys were removed
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        'timewise_local_teams',
      )
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        'timewise_local_members',
      )
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        'timewise_local_invitations',
      )
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        'timewise_local_subscriptions',
      )
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        'timewise_local_counters',
      )
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        'timewise_local_time_entries',
      )
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        'timewise_local_user_settings',
      )

      // Check that other keys were not removed
      expect(mockSessionStorage.data['other_key']).toBe('should not be removed')
    })
  })

  describe('getSessionStorageData', () => {
    it('should return all TimeWise session storage data', () => {
      // Set up test data
      mockSessionStorage.setItem(
        'timewise_local_teams',
        '{"team1": {"id": "1"}}',
      )
      mockSessionStorage.setItem(
        'timewise_local_members',
        '{"team1": [{"id": "member1"}]}',
      )
      mockSessionStorage.setItem('other_key', 'should not be included')

      const data = getSessionStorageData()

      expect(data).toEqual({
        timewise_local_teams: { team1: { id: '1' } },
        timewise_local_members: { team1: [{ id: 'member1' }] },
        timewise_local_invitations: undefined,
        timewise_local_subscriptions: undefined,
        timewise_local_counters: undefined,
        timewise_local_time_entries: undefined,
        timewise_local_user_settings: undefined,
      })
    })

    it('should handle missing data gracefully', () => {
      const data = getSessionStorageData()

      expect(data).toEqual({
        timewise_local_teams: undefined,
        timewise_local_members: undefined,
        timewise_local_invitations: undefined,
        timewise_local_subscriptions: undefined,
        timewise_local_counters: undefined,
        timewise_local_time_entries: undefined,
        timewise_local_user_settings: undefined,
      })
    })
  })

  describe('exportSessionStorageData', () => {
    it('should export data as JSON string', () => {
      mockSessionStorage.setItem(
        'timewise_local_teams',
        '{"team1": {"id": "1"}}',
      )

      const json = exportSessionStorageData()

      expect(json).toBe(
        JSON.stringify(
          {
            timewise_local_teams: { team1: { id: '1' } },
            timewise_local_members: undefined,
            timewise_local_invitations: undefined,
            timewise_local_subscriptions: undefined,
            timewise_local_counters: undefined,
            timewise_local_time_entries: undefined,
            timewise_local_user_settings: undefined,
          },
          null,
          2,
        ),
      )
    })
  })

  describe('importSessionStorageData', () => {
    it('should import data from JSON string', () => {
      const testData = {
        timewise_local_teams: { team1: { id: '1' } },
        timewise_local_members: { team1: [{ id: 'member1' }] },
      }

      const jsonString = JSON.stringify(testData)

      importSessionStorageData(jsonString)

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'timewise_local_teams',
        JSON.stringify(testData['timewise_local_teams']),
      )
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'timewise_local_members',
        JSON.stringify(testData['timewise_local_members']),
      )
    })

    it('should handle invalid JSON gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      importSessionStorageData('invalid json')

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to import session storage data:',
        expect.any(Error),
      )

      consoleSpy.mockRestore()
    })
  })
})
