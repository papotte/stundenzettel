import type { UserSettings } from '@/lib/types'

const userSettings: { [userId: string]: Partial<UserSettings> } = {
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
}

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
}
