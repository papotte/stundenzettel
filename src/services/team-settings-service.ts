import { doc, getDoc, setDoc } from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { EffectiveUserSettings, TeamSettings } from '@/lib/types'

import { getUserSettings } from './user-settings-service'

const removeUndefinedFields = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value
      .map((item) => removeUndefinedFields(item))
      .filter((item) => item !== undefined) as unknown as T
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce(
      (acc, [key, val]) => {
        if (val === undefined) {
          return acc
        }

        const cleanedValue =
          val !== null && typeof val === 'object'
            ? removeUndefinedFields(val)
            : val

        if (cleanedValue !== undefined) {
          ;(acc as Record<string, unknown>)[key] = cleanedValue
        }

        return acc
      },
      {} as Record<string, unknown>,
    ) as T
  }

  return value
}

export const getTeamSettings = async (
  teamId: string,
): Promise<TeamSettings> => {
  const teamRef = doc(db, 'teams', teamId)
  const teamDoc = await getDoc(teamRef)

  if (!teamDoc.exists()) {
    return {}
  }

  const teamData = teamDoc.data()
  return (teamData?.settings as TeamSettings | undefined) || {}
}

export const setTeamSettings = async (
  teamId: string,
  settings: TeamSettings,
): Promise<void> => {
  const teamRef = doc(db, 'teams', teamId)

  const sanitizedSettings = removeUndefinedFields(settings)

  await setDoc(teamRef, { settings: sanitizedSettings }, { merge: true })
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
      },
      compensationSplitEnabled: true,
    }
  }

  const teamSettings = await getTeamSettings(teamId)

  const effectiveSettings = { ...userSettings }

  if (teamSettings.enableCompensationSplit === false) {
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
    },
    compensationSplitEnabled: teamSettings.enableCompensationSplit ?? true,
  }
}
