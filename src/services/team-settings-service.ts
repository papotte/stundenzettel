import type { TeamSettings } from '@/lib/types'

import * as firestoreService from './team-settings-service.firestore'
import * as localService from './team-settings-service.local'

const useMockService =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'test' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'

const service = useMockService ? localService : firestoreService

if (useMockService) {
  console.info(
    `Using local team settings service (NEXT_PUBLIC_ENVIRONMENT=${process.env.NEXT_PUBLIC_ENVIRONMENT}).`,
  )
}

export const getTeamSettings = (teamId: string): Promise<TeamSettings> => {
  return service.getTeamSettings(teamId)
}

export const setTeamSettings = (
  teamId: string,
  settings: TeamSettings,
): Promise<void> => {
  return service.setTeamSettings(teamId, settings)
}

export const getEffectiveUserSettings = (
  userId: string,
  teamId?: string,
): Promise<{
  settings: any
  overrides: {
    canOverrideCompensation: boolean
    canOverrideExportSettings: boolean
    canOverrideWorkHours: boolean
  }
  compensationSplitEnabled: boolean
}> => {
  return service.getEffectiveUserSettings(userId, teamId)
}