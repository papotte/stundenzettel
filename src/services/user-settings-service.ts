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
  const [settingsSnap, userSnap] = await Promise.all([
    getDoc(doc(db, 'users', userId, 'settings', 'general')),
    getDoc(doc(db, 'users', userId)),
  ])

  if (settingsSnap.exists()) {
    const settings = {
      ...defaultSettings,
      ...settingsSnap.data(),
    } as UserSettings
    // displayName lives on user doc (public); prefer it when present
    if (userSnap.exists()) {
      const raw = userSnap.data()?.displayName
      settings.displayName = (typeof raw === 'string' ? raw : '').trim()
    }
    return settings
  }
  // If no settings exist, create them with default values
  await setUserSettings(userId, defaultSettings)
  return defaultSettings
}

/**
 * Fetches displayName from the user document (public, anyone can read).
 * Returns '' if doc missing or on error.
 */
export const getDisplayNameForMember = async (
  userId: string,
): Promise<string> => {
  if (!userId) return ''
  try {
    const docRef = doc(db, 'users', userId)
    const docSnap = await getDoc(docRef)
    console.log('docRef for user id', userId, docSnap.data())
    if (docSnap.exists()) {
      console.log('docSnap.data()', docSnap.data())
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
  console.log('getDisplayNamesForMembers', memberIds)
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

  // Keep displayName on user document for public read (team lists, etc.)
  if ('displayName' in cleanSettings) {
    const userRef = doc(db, 'users', userId)
    await setDoc(
      userRef,
      { displayName: cleanSettings.displayName ?? '' },
      { merge: true },
    )
  }
}
