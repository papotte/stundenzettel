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
})
