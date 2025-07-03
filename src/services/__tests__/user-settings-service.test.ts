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
    companyName: '',
    companyEmail: '',
    companyPhone1: '',
    companyPhone2: '',
    companyFax: '',
  }

  it('should get custom settings for a pre-configured user', async () => {
    const settings = await getUserSettings(existingUserIdWithCustomSettings)

    expect(settings.language).toBe('de')
    expect(settings.companyName).toBe('Acme Inc.')
    expect(settings.defaultWorkHours).toBe(7)
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
    }

    // Cast to UserSettings as the service expects the full object, even though we test partial update logic
    await setUserSettings(newUserId, settingsToSet as UserSettings)

    const updatedSettings = await getUserSettings(newUserId)

    // Check that the new settings were applied and merged with defaults
    expect(updatedSettings.language).toBe('en')
    expect(updatedSettings.defaultWorkHours).toBe(8.5)
    expect(updatedSettings.companyName).toBe('Test Corp Inc.')
    expect(updatedSettings.defaultStartTime).toBe(
      defaultSettings.defaultStartTime,
    ) // Check a default value is still there
  })
})
