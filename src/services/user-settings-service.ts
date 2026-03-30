import { doc, getDoc, setDoc } from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { TeamSettings, UserSettings } from '@/lib/types'

import { getUserTeamMembership } from './team-service'
import { getTeamSettings } from './team-settings-service'

const defaultSettings: UserSettings = {
  defaultWorkHours: 8,
  defaultStartTime: '09:00',
  defaultEndTime: '17:00',
  language: 'en',
  displayName: '', // New
  companyName: '',
  companyEmail: '',
  companyPhone1: '',
  companyPhone2: '',
  companyFax: '',
  driverCompensationPercent: 100,
  passengerCompensationPercent: 90,
  // expectedMonthlyHours is not included in default settings - it will be auto-calculated
}

function applyTeamCompensationFromContext(
  settings: UserSettings,
  membership: { teamId: string; role: string } | null,
  teamSettings: TeamSettings | null,
): UserSettings {
  if (!membership || membership.role !== 'member' || !teamSettings) {
    return settings
  }
  if (teamSettings.allowMemberOverrideCompensation !== false) {
    return settings
  }
  return {
    ...settings,
    driverCompensationPercent:
      teamSettings.defaultDriverCompensationPercent ?? 100,
    passengerCompensationPercent:
      teamSettings.defaultPassengerCompensationPercent ?? 90,
  }
}

async function loadUserSettingsWithTeamContext(userId: string): Promise<{
  settings: UserSettings
  compensationLocked: boolean
}> {
  if (!userId) {
    return { settings: defaultSettings, compensationLocked: false }
  }

  const membership = await getUserTeamMembership(userId)
  const teamSettings = membership
    ? await getTeamSettings(membership.teamId)
    : null
  const compensationLocked =
    membership?.role === 'member' &&
    teamSettings != null &&
    teamSettings.allowMemberOverrideCompensation === false

  const [settingsSnap, userSnap] = await Promise.all([
    getDoc(doc(db, 'users', userId, 'settings', 'general')),
    getDoc(doc(db, 'users', userId)),
  ])

  let core: UserSettings

  if (settingsSnap.exists()) {
    core = {
      ...defaultSettings,
      ...settingsSnap.data(),
    } as UserSettings
    if (userSnap.exists()) {
      const raw = userSnap.data()?.displayName
      core.displayName = (typeof raw === 'string' ? raw : '').trim()
    }
  } else {
    let initial: Record<string, unknown>
    if (compensationLocked) {
      initial = { ...defaultSettings }
      delete initial.driverCompensationPercent
      delete initial.passengerCompensationPercent
    } else {
      initial = { ...defaultSettings }
    }
    await setUserSettings(userId, initial as UserSettings)
    core = {
      ...defaultSettings,
      ...initial,
    } as UserSettings
  }

  const settings = applyTeamCompensationFromContext(
    core,
    membership,
    teamSettings,
  )
  return { settings, compensationLocked }
}

export const getUserSettings = async (
  userId: string,
): Promise<UserSettings> => {
  const { settings } = await loadUserSettingsWithTeamContext(userId)
  return settings
}

/** Company page: effective settings plus whether compensation fields are team-controlled. */
export async function getUserSettingsWithCompensationLock(
  userId: string,
): Promise<{ settings: UserSettings; compensationLocked: boolean }> {
  return loadUserSettingsWithTeamContext(userId)
}

export const getDisplayNameForMember = async (
  userId: string,
): Promise<string> => {
  if (!userId) return ''
  try {
    const docRef = doc(db, 'users', userId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const name = (docSnap.data().displayName as string | undefined) ?? ''
      return name.trim()
    }
    return ''
  } catch (e) {
    console.error('Error getting displayName for member', userId, e)
    return ''
  }
}

/**
 * Fetches displayName for each member using getDisplayNameForMember. Returns a Map
 * of memberId -> displayName (or ''). Use when an admin/owner needs to show
 * multiple members' names (e.g. team-members-list, seat-assignment-dialog).
 */
export const getDisplayNamesForMembers = async (
  memberIds: string[],
): Promise<Map<string, string>> => {
  if (memberIds.length === 0) return new Map()
  const results = await Promise.all(
    memberIds.map(async (id) => ({
      id,
      name: await getDisplayNameForMember(id),
    })),
  )
  return new Map(results.map((r) => [r.id, r.name]))
}

export const setUserSettings = async (
  userId: string,
  settings: Partial<UserSettings>,
): Promise<void> => {
  if (!userId) throw new Error('User not authenticated')

  // Filter out undefined values to prevent Firestore validation errors
  const cleanSettings = Object.fromEntries(
    Object.entries(settings).filter(([, value]) => value !== undefined),
  ) as Partial<UserSettings>

  const membership = await getUserTeamMembership(userId)
  const teamSettings = membership
    ? await getTeamSettings(membership.teamId)
    : null
  const compensationLocked =
    membership?.role === 'member' &&
    teamSettings != null &&
    teamSettings.allowMemberOverrideCompensation === false

  const toWrite = { ...cleanSettings }
  if (compensationLocked) {
    delete toWrite.driverCompensationPercent
    delete toWrite.passengerCompensationPercent
  }

  const docRef = doc(db, 'users', userId, 'settings', 'general')
  await setDoc(docRef, toWrite, { merge: true })

  // Keep displayName on user document for public read (team lists, etc.)
  if ('displayName' in toWrite) {
    const userRef = doc(db, 'users', userId)
    await setDoc(
      userRef,
      { displayName: toWrite.displayName ?? '' },
      { merge: true },
    )
  }
}
