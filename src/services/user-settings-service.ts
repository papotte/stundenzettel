import { doc, getDoc, setDoc } from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { TeamSettings, UserSettings } from '@/lib/types'

import { getUserTeamMembership } from './team-service'
import { getTeamSettings } from './team-settings-service'

/** Baseline settings before Firestore merge; used by the service and client fallbacks (e.g. time tracker while query is loading). */
export const DEFAULT_USER_SETTINGS: UserSettings = {
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
  passengerCompensationPercent: 100,
  // expectedMonthlyHours is not included in default settings - it will be auto-calculated
}

function applyTeamCompensationFromContext(
  settings: UserSettings,
  membership: { teamId: string; role: string } | null,
  teamSettings: TeamSettings | null,
): UserSettings {
  if (!membership || !teamSettings) {
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
      teamSettings.defaultPassengerCompensationPercent ?? 100,
  }
}

function resolveExportIncludeFlags(
  settings: UserSettings,
  membership: { teamId: string; role: string } | null,
  teamSettings: TeamSettings | null,
): {
  exportIncludeDriverTime: boolean
  exportIncludePassengerTime: boolean
  exportLocked: boolean
} {
  const teamDriver = teamSettings?.exportIncludeDriverTime ?? true
  const teamPassenger = teamSettings?.exportIncludePassengerTime ?? true
  const exportLocked =
    membership != null &&
    teamSettings != null &&
    teamSettings.allowMemberOverrideExport === false

  if (exportLocked) {
    return {
      exportIncludeDriverTime: teamDriver,
      exportIncludePassengerTime: teamPassenger,
      exportLocked: true,
    }
  }
  if (membership && teamSettings) {
    return {
      exportIncludeDriverTime: settings.exportIncludeDriverTime ?? teamDriver,
      exportIncludePassengerTime:
        settings.exportIncludePassengerTime ?? teamPassenger,
      exportLocked: false,
    }
  }
  return {
    exportIncludeDriverTime: settings.exportIncludeDriverTime ?? true,
    exportIncludePassengerTime: settings.exportIncludePassengerTime ?? true,
    exportLocked: false,
  }
}

function buildLockedField(
  compensationLocked: boolean,
  exportLocked: boolean,
): UserSettings['locked'] {
  if (!compensationLocked && !exportLocked) return undefined
  const o: NonNullable<UserSettings['locked']> = {}
  if (compensationLocked) o.compensation = true
  if (exportLocked) o.export = true
  return o
}

function stripLockedFromFirestorePayload(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const copy = { ...data }
  delete copy.locked
  return copy
}

async function resolveTeamContext(userId: string): Promise<{
  membership: { teamId: string; role: string } | null
  teamSettings: TeamSettings | null
  compensationLocked: boolean
  exportLocked: boolean
}> {
  const membership = await getUserTeamMembership(userId)
  const teamSettings = membership
    ? await getTeamSettings(membership.teamId)
    : null
  const compensationLocked =
    membership != null &&
    teamSettings != null &&
    teamSettings.allowMemberOverrideCompensation === false
  const exportLocked =
    membership != null &&
    teamSettings != null &&
    teamSettings.allowMemberOverrideExport === false

  return { membership, teamSettings, compensationLocked, exportLocked }
}

function buildInitialSettings(
  compensationLocked: boolean,
  exportLocked: boolean,
): UserSettings {
  const initial = { ...DEFAULT_USER_SETTINGS } as UserSettings

  if (compensationLocked) {
    delete initial.driverCompensationPercent
    delete initial.passengerCompensationPercent
  }
  if (exportLocked) {
    delete initial.exportIncludeDriverTime
    delete initial.exportIncludePassengerTime
  }

  return initial
}

function mergeUserDisplayName(
  settings: UserSettings,
  userRaw: unknown,
): UserSettings {
  const raw = (userRaw as { displayName?: unknown } | undefined)?.displayName
  return {
    ...settings,
    displayName: (typeof raw === 'string' ? raw : '').trim(),
  }
}

async function loadUserSettingsWithTeamContext(
  userId: string,
): Promise<UserSettings> {
  if (!userId) {
    return { ...DEFAULT_USER_SETTINGS }
  }

  const { membership, teamSettings, compensationLocked, exportLocked } =
    await resolveTeamContext(userId)

  const [settingsSnap, userSnap] = await Promise.all([
    getDoc(doc(db, 'users', userId, 'settings', 'general')),
    getDoc(doc(db, 'users', userId)),
  ])

  let core: UserSettings

  if (settingsSnap.exists()) {
    const rawData = settingsSnap.data() as Record<string, unknown>
    core = {
      ...DEFAULT_USER_SETTINGS,
      ...stripLockedFromFirestorePayload(rawData),
    } as UserSettings
    if (userSnap.exists()) {
      core = mergeUserDisplayName(core, userSnap.data())
    }
  } else {
    const initial = buildInitialSettings(compensationLocked, exportLocked)
    await setUserSettings(userId, initial)
    core = {
      ...DEFAULT_USER_SETTINGS,
      ...initial,
    } as UserSettings
  }

  const merged = applyTeamCompensationFromContext(
    core,
    membership,
    teamSettings,
  )
  const resolvedExport = resolveExportIncludeFlags(
    merged,
    membership,
    teamSettings,
  )
  const locked = buildLockedField(
    compensationLocked,
    resolvedExport.exportLocked,
  )
  const out: UserSettings = {
    ...merged,
    exportIncludeDriverTime: resolvedExport.exportIncludeDriverTime,
    exportIncludePassengerTime: resolvedExport.exportIncludePassengerTime,
  }
  if (locked) out.locked = locked
  return out
}

export const getUserSettings = async (
  userId: string,
): Promise<UserSettings> => {
  return loadUserSettingsWithTeamContext(userId)
}

/** Strip computed read-only fields before spreading into forms or merge payloads. */
export function stripReadOnlySettingsFields(
  settings: UserSettings,
): Omit<UserSettings, 'locked'> {
  const copy = { ...settings }
  delete copy.locked
  return copy
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

  delete cleanSettings.locked

  const membership = await getUserTeamMembership(userId)
  const teamSettings = membership
    ? await getTeamSettings(membership.teamId)
    : null
  const compensationLocked =
    membership != null &&
    teamSettings != null &&
    teamSettings.allowMemberOverrideCompensation === false
  const exportLocked =
    membership != null &&
    teamSettings != null &&
    teamSettings.allowMemberOverrideExport === false

  const toWrite = { ...cleanSettings }
  if (compensationLocked) {
    delete toWrite.driverCompensationPercent
    delete toWrite.passengerCompensationPercent
  }
  if (exportLocked) {
    delete toWrite.exportIncludeDriverTime
    delete toWrite.exportIncludePassengerTime
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
