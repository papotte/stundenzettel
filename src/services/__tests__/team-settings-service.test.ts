import type { TeamSettings } from '@/lib/types'

import { getTeamSettings, setTeamSettings } from '../team-settings-service'

describe('TeamSettingsService', () => {
  const mockTeamId = 'test-team-id'

  const sampleSettings: TeamSettings = {
    exportFormat: 'excel',
    exportFields: {
      includeLocation: true,
      includePauseDuration: true,
      includeDriverTime: true,
      includePassengerTime: true,
      includeMileage: false,
    },
    defaultDriverCompensationPercent: 100,
    defaultPassengerCompensationPercent: 90,
    allowMembersToOverrideCompensation: true,
    allowMembersToOverrideExportSettings: false,
    allowMembersToOverrideWorkHours: true,
    companyName: 'Test Company',
    companyEmail: 'test@company.com',
  }

  it('should set and get team settings', async () => {
    // Set team settings
    await setTeamSettings(mockTeamId, sampleSettings)

    // Get team settings
    const retrievedSettings = await getTeamSettings(mockTeamId)

    // Verify settings were saved correctly
    expect(retrievedSettings.exportFormat).toBe('excel')
    expect(retrievedSettings.defaultDriverCompensationPercent).toBe(100)
    expect(retrievedSettings.companyName).toBe('Test Company')
    expect(retrievedSettings.exportFields?.includeLocation).toBe(true)
    expect(retrievedSettings.allowMembersToOverrideCompensation).toBe(true)
  })

  it('should return empty object for non-existent team', async () => {
    const settings = await getTeamSettings('non-existent-team')
    expect(settings).toEqual({})
  })

  it('should handle partial settings updates', async () => {
    // Set initial settings
    await setTeamSettings(mockTeamId, sampleSettings)

    // Update only some fields
    const partialUpdate: Partial<TeamSettings> = {
      defaultDriverCompensationPercent: 95,
      companyName: 'Updated Company Name',
    }

    await setTeamSettings(mockTeamId, partialUpdate)

    const updatedSettings = await getTeamSettings(mockTeamId)
    expect(updatedSettings.defaultDriverCompensationPercent).toBe(95)
    expect(updatedSettings.companyName).toBe('Updated Company Name')
  })
})
