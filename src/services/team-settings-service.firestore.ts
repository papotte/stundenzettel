import { doc, getDoc, setDoc } from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { EffectiveUserSettings, TeamSettings } from '@/lib/types'

import { getUserSettings } from './user-settings-service'

export const getTeamSettings = async (
  teamId: string,
): Promise<TeamSettings> => {
  const teamRef = doc(db, 'teams', teamId)
  const teamDoc = await getDoc(teamRef)

  if (!teamDoc.exists()) {
    throw new Error('Team not found')
  }

  const teamData = teamDoc.data()
  return teamData.settings || {}
}

export const setTeamSettings = async (
  teamId: string,
  settings: TeamSettings,
): Promise<void> => {
  const teamRef = doc(db, 'teams', teamId)

  // Update only the settings field of the team document
  await setDoc(teamRef, { settings }, { merge: true })
}

export const getEffectiveUserSettings = async (
  userId: string,
  teamId?: string,
): Promise<EffectiveUserSettings> => {
  const userSettings = await getUserSettings(userId)

  if (!teamId) {
    return {
      settings: userSettings,
      overrides: {
        canOverrideCompensation: true,
        canOverrideExportSettings: true,
        canOverrideWorkHours: true,
      },
      compensationSplitEnabled: true,
    }
  }

  const teamSettings = await getTeamSettings(teamId)

  // Merge team defaults with user settings, respecting override permissions
  const effectiveSettings = { ...userSettings }

  // Apply team defaults if user hasn't set their own values or doesn't have permission
  if (teamSettings.enableCompensationSplit === false) {
    // When compensation split is disabled, use driver compensation for both
    const singleCompensationRate =
      teamSettings.defaultDriverCompensationPercent ?? 100
    if (
      userSettings.driverCompensationPercent === undefined ||
      !teamSettings.allowMembersToOverrideCompensation
    ) {
      effectiveSettings.driverCompensationPercent = singleCompensationRate
      effectiveSettings.passengerCompensationPercent = singleCompensationRate
    }
  } else {
    // Normal split compensation logic
    if (
      teamSettings.defaultDriverCompensationPercent !== undefined &&
      (userSettings.driverCompensationPercent === undefined ||
        !teamSettings.allowMembersToOverrideCompensation)
    ) {
      effectiveSettings.driverCompensationPercent =
        teamSettings.defaultDriverCompensationPercent
    }

    if (
      teamSettings.defaultPassengerCompensationPercent !== undefined &&
      (userSettings.passengerCompensationPercent === undefined ||
        !teamSettings.allowMembersToOverrideCompensation)
    ) {
      effectiveSettings.passengerCompensationPercent =
        teamSettings.defaultPassengerCompensationPercent
    }
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
      canOverrideCompensation:
        teamSettings.allowMembersToOverrideCompensation ?? true,
      canOverrideExportSettings:
        teamSettings.allowMembersToOverrideExportSettings ?? true,
      canOverrideWorkHours:
        teamSettings.allowMembersToOverrideWorkHours ?? true,
    },
    compensationSplitEnabled: teamSettings.enableCompensationSplit ?? true,
  }
}
