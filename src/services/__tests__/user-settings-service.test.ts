import type { UserSettings } from '@/lib/types'

import * as userSettingsService from '../user-settings-service'
import * as firestoreService from '../user-settings-service.firestore'

// Mock the Firestore service
jest.mock('../user-settings-service.firestore')

const mockFirestoreService = firestoreService as jest.Mocked<
  typeof firestoreService
>

describe('User Settings Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Service Selection Logic', () => {
    it('delegates all operations to the Firestore service', async () => {
      const mockSettings: UserSettings = {
        defaultWorkHours: 7,
        defaultStartTime: '09:00',
        defaultEndTime: '17:00',
        language: 'de',
        displayName: '',
        companyName: 'Acme Inc.',
        companyEmail: '',
        companyPhone1: '',
        companyPhone2: '',
        companyFax: '',
        driverCompensationPercent: 100,
        passengerCompensationPercent: 90,
      }

      mockFirestoreService.getUserSettings.mockResolvedValue(mockSettings)

      const result = await userSettingsService.getUserSettings('user-123')

      expect(mockFirestoreService.getUserSettings).toHaveBeenCalledWith(
        'user-123',
      )
      expect(result).toEqual(mockSettings)
    })
  })

  describe('User Settings Operations', () => {
    const defaultSettings: UserSettings = {
      defaultWorkHours: 7,
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
    }

    it('getUserSettings delegates to Firestore service', async () => {
      mockFirestoreService.getUserSettings.mockResolvedValue(defaultSettings)

      const result = await userSettingsService.getUserSettings('new-user')

      expect(mockFirestoreService.getUserSettings).toHaveBeenCalledWith(
        'new-user',
      )
      expect(result).toEqual(defaultSettings)
    })

    it('setUserSettings delegates to Firestore service', async () => {
      const settingsToSet: Partial<UserSettings> = {
        language: 'en',
        defaultWorkHours: 8.5,
        companyName: 'Test Corp Inc.',
        displayName: 'Export Name',
        driverCompensationPercent: 80,
        passengerCompensationPercent: 70,
      }

      mockFirestoreService.setUserSettings.mockResolvedValue(undefined)

      await userSettingsService.setUserSettings(
        'user-123',
        settingsToSet as UserSettings,
      )

      expect(mockFirestoreService.setUserSettings).toHaveBeenCalledWith(
        'user-123',
        settingsToSet as UserSettings,
      )
    })

    it('should handle custom settings correctly', async () => {
      const customSettings: UserSettings = {
        ...defaultSettings,
        language: 'de',
        companyName: 'Acme Inc.',
        defaultWorkHours: 7,
      }

      mockFirestoreService.getUserSettings.mockResolvedValue(customSettings)

      const settings =
        await userSettingsService.getUserSettings('existing-user')

      expect(mockFirestoreService.getUserSettings).toHaveBeenCalledWith(
        'existing-user',
      )
      expect(settings.language).toBe('de')
      expect(settings.companyName).toBe('Acme Inc.')
      expect(settings.defaultWorkHours).toBe(7)
      expect(settings.driverCompensationPercent).toBe(100)
      expect(settings.passengerCompensationPercent).toBe(90)
    })

    it('should handle partial settings updates', async () => {
      const partialSettings: Partial<UserSettings> = {
        language: 'en',
        defaultWorkHours: 8.5,
      }

      mockFirestoreService.setUserSettings.mockResolvedValue(undefined)

      await userSettingsService.setUserSettings(
        'user-123',
        partialSettings as UserSettings,
      )

      expect(mockFirestoreService.setUserSettings).toHaveBeenCalledWith(
        'user-123',
        partialSettings as UserSettings,
      )
    })
  })
})
