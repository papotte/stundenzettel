import { doc, getDoc, setDoc } from 'firebase/firestore'
import type { DocumentReference, DocumentSnapshot } from 'firebase/firestore'

import type { UserSettings } from '@/lib/types'

import * as userSettingsService from '../user-settings-service'

// Mock Firebase Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}))

// Mock the Firebase db
jest.mock('@/lib/firebase', () => ({
  db: {},
}))

const mockDoc = doc as jest.MockedFunction<typeof doc>
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>

describe('User Settings Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('User Settings Operations', () => {
    const defaultSettings: UserSettings = {
      defaultWorkHours: 8,
      defaultStartTime: '09:00',
      defaultEndTime: '17:00',
      language: 'en',
      displayName: '',
      companyName: '',
      companyEmail: '',
      companyPhone1: '',
      companyPhone2: '',
      companyFax: '',
      driverCompensationPercent: 100,
      passengerCompensationPercent: 90,
      expectedMonthlyHours: undefined,
    }

    it('getUserSettings returns default settings when no user ID provided', async () => {
      const result = await userSettingsService.getUserSettings('')

      expect(result).toEqual(defaultSettings)
    })

    it('getUserSettings returns default settings when document does not exist', async () => {
      const mockDocRef = {}
      const mockDocSnap = { exists: () => false }

      mockDoc.mockReturnValue(mockDocRef as DocumentReference)
      mockGetDoc.mockResolvedValue(mockDocSnap as unknown as DocumentSnapshot)
      mockSetDoc.mockResolvedValue(undefined)

      const result = await userSettingsService.getUserSettings('new-user')

      expect(mockDoc).toHaveBeenCalledWith(
        {},
        'users',
        'new-user',
        'settings',
        'general',
      )
      expect(mockGetDoc).toHaveBeenCalledWith(mockDocRef)
      expect(mockSetDoc).toHaveBeenCalledWith(mockDocRef, defaultSettings, {
        merge: true,
      })
      expect(result).toEqual(defaultSettings)
    })

    it('getUserSettings returns merged settings when document exists', async () => {
      const customSettings = {
        language: 'de',
        companyName: 'Acme Inc.',
        defaultWorkHours: 7,
      }
      const mockDocRef = {}
      const mockDocSnap = {
        exists: () => true,
        data: () => customSettings,
      }

      mockDoc.mockReturnValue(mockDocRef as DocumentReference)
      mockGetDoc.mockResolvedValue(mockDocSnap as unknown as DocumentSnapshot)

      const result = await userSettingsService.getUserSettings('existing-user')

      expect(mockDoc).toHaveBeenCalledWith(
        {},
        'users',
        'existing-user',
        'settings',
        'general',
      )
      expect(mockGetDoc).toHaveBeenCalledWith(mockDocRef)
      expect(result).toEqual({ ...defaultSettings, ...customSettings })
    })

    it('setUserSettings calls setDoc with correct parameters', async () => {
      const settingsToSet: Partial<UserSettings> = {
        language: 'en',
        defaultWorkHours: 8.5,
        companyName: 'Test Corp Inc.',
        displayName: 'Export Name',
        driverCompensationPercent: 80,
        passengerCompensationPercent: 70,
      }

      const mockDocRef = {}
      mockDoc.mockReturnValue(mockDocRef as DocumentReference)
      mockSetDoc.mockResolvedValue(undefined)

      await userSettingsService.setUserSettings('user-123', settingsToSet)

      expect(mockDoc).toHaveBeenCalledWith(
        {},
        'users',
        'user-123',
        'settings',
        'general',
      )
      expect(mockSetDoc).toHaveBeenCalledWith(mockDocRef, settingsToSet, {
        merge: true,
      })
    })

    it('setUserSettings throws error when no user ID provided', async () => {
      await expect(userSettingsService.setUserSettings('', {})).rejects.toThrow(
        'User not authenticated',
      )
    })
  })

  describe('getDisplayNameForMember', () => {
    it('returns displayName when document exists', async () => {
      const mockDocRef = {}
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ displayName: '  Jane Doe  ' }),
      }

      mockDoc.mockReturnValue(mockDocRef as DocumentReference)
      mockGetDoc.mockResolvedValue(mockDocSnap as unknown as DocumentSnapshot)

      const result = await userSettingsService.getDisplayNameForMember('user-1')

      expect(mockGetDoc).toHaveBeenCalledWith(mockDocRef)
      expect(mockSetDoc).not.toHaveBeenCalled()
      expect(result).toBe('Jane Doe')
    })

    it('returns empty string when document does not exist', async () => {
      const mockDocRef = {}
      const mockDocSnap = { exists: () => false }

      mockDoc.mockReturnValue(mockDocRef as DocumentReference)
      mockGetDoc.mockResolvedValue(mockDocSnap as unknown as DocumentSnapshot)

      const result = await userSettingsService.getDisplayNameForMember('user-1')

      expect(result).toBe('')
    })

    it('returns empty string when userId is empty', async () => {
      const result = await userSettingsService.getDisplayNameForMember('')

      expect(mockGetDoc).not.toHaveBeenCalled()
      expect(result).toBe('')
    })

    it('returns empty string on getDoc error', async () => {
      mockDoc.mockReturnValue({} as DocumentReference)
      mockGetDoc.mockRejectedValue(new Error('Permission denied'))

      const result = await userSettingsService.getDisplayNameForMember('user-1')

      expect(result).toBe('')
    })
  })

  describe('getDisplayNamesForMembers', () => {
    it('returns empty Map when memberIds is empty', async () => {
      const result = await userSettingsService.getDisplayNamesForMembers([])

      expect(result).toEqual(new Map())
      expect(mockGetDoc).not.toHaveBeenCalled()
    })

    it('returns Map of id to displayName by calling getDisplayNameForMember for each id', async () => {
      const refWithId = (id: string) =>
        ({ _id: id }) as unknown as DocumentReference
      mockDoc.mockImplementation((_db: unknown, _c: string, id: string) =>
        refWithId(id),
      )
      mockGetDoc.mockImplementation((ref: unknown) => {
        const id = (ref as { _id?: string })._id
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            displayName:
              id === 'user-1' ? 'Alice' : id === 'user-2' ? 'Bob' : '',
          }),
        } as unknown as DocumentSnapshot)
      })

      const result = await userSettingsService.getDisplayNamesForMembers([
        'user-1',
        'user-2',
      ])

      expect(result.get('user-1')).toBe('Alice')
      expect(result.get('user-2')).toBe('Bob')
      expect(mockGetDoc).toHaveBeenCalledTimes(2)
    })
  })
})
