import { doc, getDoc, setDoc } from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { UserSettings } from '@/lib/types'

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

export const getUserSettings = async (
  userId: string,
): Promise<UserSettings> => {
  if (!userId) return defaultSettings
  const docRef = doc(db, 'users', userId, 'settings', 'general')
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return { ...defaultSettings, ...docSnap.data() } as UserSettings
  }
  // If no settings exist, create them with default values
  await setUserSettings(userId, defaultSettings)
  return defaultSettings
}

/**
 * Fetches only displayName for a team member. Use when an admin/owner needs to show
 * another member's name. Does not write; returns '' if doc missing or on error.
 */
export const getDisplayNameForMember = async (
  userId: string,
): Promise<string> => {
  if (!userId) return ''
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'general')
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const name = (docSnap.data().displayName as string | undefined) ?? ''
      return name.trim()
    }
    return ''
  } catch {
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
  )

  const docRef = doc(db, 'users', userId, 'settings', 'general')
  await setDoc(docRef, cleanSettings, { merge: true })
}
