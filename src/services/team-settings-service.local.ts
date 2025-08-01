import type { TeamSettings } from '@/lib/types'
import { getUserSettings } from './user-settings-service'

// Mock team settings storage
const mockTeamSettings: Record<string, TeamSettings> = {
  'team-1': {
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
    companyName: 'Test Company Ltd.',
    companyEmail: 'contact@testcompany.com',
    companyPhone1: '+1 234 567 890',
  },
}

export const getTeamSettings = async (teamId: string): Promise<TeamSettings> => {
  return mockTeamSettings[teamId] || {}
}

export const setTeamSettings = async (
  teamId: string,
  settings: TeamSettings,
): Promise<void> => {
  mockTeamSettings[teamId] = { ...mockTeamSettings[teamId], ...settings }
}

export const getEffectiveUserSettings = async (
  userId: string,
  teamId?: string,
): Promise<{
  settings: any
  overrides: {
    canOverrideCompensation: boolean
    canOverrideExportSettings: boolean
    canOverrideWorkHours: boolean
  }
}> => {
  const userSettings = await getUserSettings(userId)
  
  if (!teamId) {
    return {
      settings: userSettings,
      overrides: {
        canOverrideCompensation: true,
        canOverrideExportSettings: true,
        canOverrideWorkHours: true,
      },
    }
  }
  
  const teamSettings = await getTeamSettings(teamId)
  
  // Merge team defaults with user settings, respecting override permissions
  const effectiveSettings = { ...userSettings }
  
  // Apply team defaults if user hasn't set their own values or doesn't have permission
  if (teamSettings.defaultDriverCompensationPercent !== undefined && 
      (userSettings.driverCompensationPercent === undefined || 
       !teamSettings.allowMembersToOverrideCompensation)) {
    effectiveSettings.driverCompensationPercent = teamSettings.defaultDriverCompensationPercent
  }
  
  if (teamSettings.defaultPassengerCompensationPercent !== undefined && 
      (userSettings.passengerCompensationPercent === undefined || 
       !teamSettings.allowMembersToOverrideCompensation)) {
    effectiveSettings.passengerCompensationPercent = teamSettings.defaultPassengerCompensationPercent
  }
  
  // Apply team company details if available
  if (teamSettings.companyName) {
    effectiveSettings.companyName = teamSettings.companyName
  }
  if (teamSettings.companyEmail) {
    effectiveSettings.companyEmail = teamSettings.companyEmail
  }
  if (teamSettings.companyPhone1) {
    effectiveSettings.companyPhone1 = teamSettings.companyPhone1
  }
  if (teamSettings.companyPhone2) {
    effectiveSettings.companyPhone2 = teamSettings.companyPhone2
  }
  if (teamSettings.companyFax) {
    effectiveSettings.companyFax = teamSettings.companyFax
  }
  
  return {
    settings: effectiveSettings,
    overrides: {
      canOverrideCompensation: teamSettings.allowMembersToOverrideCompensation ?? true,
      canOverrideExportSettings: teamSettings.allowMembersToOverrideExportSettings ?? true,
      canOverrideWorkHours: teamSettings.allowMembersToOverrideWorkHours ?? true,
    },
  }
}