import type { UserSettings } from '@/lib/types'

// Session storage key for user settings
const STORAGE_KEY = 'timewise_local_user_settings'

// Helper functions for session storage
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue

  try {
    const stored = sessionStorage.getItem(key)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn(`Failed to parse stored data for ${key}:`, error)
  }
  return defaultValue
}

const saveToStorage = (key: string, data: unknown): void => {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.warn(`Failed to save data to storage for ${key}:`, error)
  }
}

// Initialize user settings from session storage or use defaults
let userSettings: { [userId: string]: Partial<UserSettings> } = getFromStorage(
  STORAGE_KEY,
  {
    'mock-user-1': {
      defaultWorkHours: 7,
      defaultStartTime: '09:00',
      defaultEndTime: '17:00',
      language: 'de',
      companyName: 'Acme Inc.',
      driverCompensationPercent: 100,
      passengerCompensationPercent: 90,
    },
    'mock-user-2': {
      defaultWorkHours: 7.5,
      defaultStartTime: '08:30',
      defaultEndTime: '16:30',
      language: 'en',
      displayName: 'Max Mustermann',
      driverCompensationPercent: 100,
      passengerCompensationPercent: 90,
    },
  },
)

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

// Helper function to save settings to storage
const persistSettings = (): void => {
  saveToStorage(STORAGE_KEY, userSettings)
}

export const getUserSettings = async (
  userId: string,
): Promise<UserSettings> => {
  if (userSettings[userId]) {
    return { ...defaultSettings, ...userSettings[userId] }
  }
  return defaultSettings
}

export const setUserSettings = async (
  userId: string,
  settings: Partial<UserSettings>,
): Promise<void> => {
  userSettings[userId] = { ...userSettings[userId], ...settings }
  persistSettings()
}

// Utility function to clear session storage data (useful for testing)
export function clearUserSettingsStorage(): void {
  if (typeof window === 'undefined') return

  sessionStorage.removeItem(STORAGE_KEY)
  userSettings = {}
}
