import type { TeamSettings } from '@/lib/types'

import {
  getEffectiveUserSettings,
  getTeamSettings,
  setTeamSettings,
} from '../team-settings-service'
import { mockTeamSettings } from '../team-settings-service.local'

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

  beforeEach(() => {
    // Clear any existing team settings to ensure test isolation
    delete mockTeamSettings[mockTeamId]
  })

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

  describe('getEffectiveUserSettings', () => {
    const mockUserId = 'test-user-id'

    it('should return user settings with all override permissions when no team', async () => {
      const result = await getEffectiveUserSettings(mockUserId)

      expect(result.overrides.canOverrideCompensation).toBe(true)
      expect(result.overrides.canOverrideExportSettings).toBe(true)
      expect(result.overrides.canOverrideWorkHours).toBe(true)
      expect(result.compensationSplitEnabled).toBe(true)
      expect(result.settings).toBeDefined()
    })

    it('should merge team settings with user settings', async () => {
      const teamSettings: TeamSettings = {
        exportFormat: 'pdf',
        enableCompensationSplit: true,
        defaultDriverCompensationPercent: 80,
        defaultPassengerCompensationPercent: 70,
        allowMembersToOverrideCompensation: false,
        allowMembersToOverrideExportSettings: true,
        allowMembersToOverrideWorkHours: false,
        companyName: 'Team Company',
        companyEmail: 'team@company.com',
      }

      await setTeamSettings(mockTeamId, teamSettings)

      const result = await getEffectiveUserSettings(mockUserId, mockTeamId)

      expect(result.overrides.canOverrideCompensation).toBe(false)
      expect(result.overrides.canOverrideExportSettings).toBe(true)
      expect(result.overrides.canOverrideWorkHours).toBe(false)
      expect(result.compensationSplitEnabled).toBe(true)
      expect(result.settings.companyName).toBe('Team Company')
      expect(result.settings.companyEmail).toBe('team@company.com')
    })

    it('should handle compensation split disabled mode', async () => {
      const teamSettings: TeamSettings = {
        enableCompensationSplit: false,
        defaultDriverCompensationPercent: 85,
        allowMembersToOverrideCompensation: false,
      }

      await setTeamSettings(mockTeamId, teamSettings)

      const result = await getEffectiveUserSettings(mockUserId, mockTeamId)

      expect(result.compensationSplitEnabled).toBe(false)
      expect(result.settings.driverCompensationPercent).toBe(85)
      expect(result.settings.passengerCompensationPercent).toBe(85)
    })

    it('should apply single compensation rate when split is disabled', async () => {
      const teamSettings: TeamSettings = {
        enableCompensationSplit: false,
        defaultDriverCompensationPercent: 95,
        defaultPassengerCompensationPercent: 75, // This should be ignored
        allowMembersToOverrideCompensation: false,
      }

      await setTeamSettings(mockTeamId, teamSettings)

      const result = await getEffectiveUserSettings(mockUserId, mockTeamId)

      expect(result.compensationSplitEnabled).toBe(false)
      // Both driver and passenger should use the single driver rate
      expect(result.settings.driverCompensationPercent).toBe(95)
      expect(result.settings.passengerCompensationPercent).toBe(95)
    })

    it('should use default 100% rate when compensation split disabled and no team rate set', async () => {
      const teamSettings: TeamSettings = {
        enableCompensationSplit: false,
        allowMembersToOverrideCompensation: false,
      }

      await setTeamSettings(mockTeamId, teamSettings)

      const result = await getEffectiveUserSettings(mockUserId, mockTeamId)

      expect(result.compensationSplitEnabled).toBe(false)
      expect(result.settings.driverCompensationPercent).toBe(100)
      expect(result.settings.passengerCompensationPercent).toBe(100)
    })

    it('should respect user override permissions', async () => {
      const teamSettings: TeamSettings = {
        enableCompensationSplit: true,
        defaultDriverCompensationPercent: 80,
        defaultPassengerCompensationPercent: 70,
        allowMembersToOverrideCompensation: true, // User can override
        companyName: 'Team Company',
      }

      await setTeamSettings(mockTeamId, teamSettings)

      const result = await getEffectiveUserSettings(mockUserId, mockTeamId)

      expect(result.overrides.canOverrideCompensation).toBe(true)
      expect(result.compensationSplitEnabled).toBe(true)
      // Company details should still be applied
      expect(result.settings.companyName).toBe('Team Company')
    })
  })
})
