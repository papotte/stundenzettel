import type { UserSettings } from '@/lib/types'

import { getUserSettings, setUserSettings } from '../user-settings-service'

// These tests will automatically use the local implementation due to the environment.
describe('User Settings Service (Local Implementation)', () => {
  const existingUserIdWithCustomSettings = 'mock-user-1'
  const newUserId = 'new-user-for-settings-test'

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

  it('should get custom settings for a pre-configured user', async () => {
    const settings = await getUserSettings(existingUserIdWithCustomSettings)
    expect(settings.language).toBe('de')
    expect(settings.companyName).toBe('Acme Inc.')
    expect(settings.defaultWorkHours).toBe(7)
    expect(settings.displayName).toBe('')
    expect(settings.driverCompensationPercent).toBe(100)
    expect(settings.passengerCompensationPercent).toBe(90)
  })

  it('should return default settings for a new user', async () => {
    const settings = await getUserSettings(newUserId)
    expect(settings).toEqual(defaultSettings)
  })

  it('should set and update user settings correctly', async () => {
    const settingsToSet: Partial<UserSettings> = {
      language: 'en',
      defaultWorkHours: 8.5,
      companyName: 'Test Corp Inc.',
      displayName: 'Export Name',
      driverCompensationPercent: 80,
      passengerCompensationPercent: 70,
    }
    await setUserSettings(newUserId, settingsToSet as UserSettings)
    const updatedSettings = await getUserSettings(newUserId)
    expect(updatedSettings.language).toBe('en')
    expect(updatedSettings.defaultWorkHours).toBe(8.5)
    expect(updatedSettings.companyName).toBe('Test Corp Inc.')
    expect(updatedSettings.defaultStartTime).toBe(
      defaultSettings.defaultStartTime,
    )
    expect(updatedSettings.displayName).toBe('Export Name')
    expect(updatedSettings.driverCompensationPercent).toBe(80)
    expect(updatedSettings.passengerCompensationPercent).toBe(70)
  })

  it('should allow clearing displayName (blank fallback)', async () => {
    await setUserSettings(newUserId, { displayName: '' } as UserSettings)
    const updatedSettings = await getUserSettings(newUserId)
    expect(updatedSettings.displayName).toBe('')
  })
})
