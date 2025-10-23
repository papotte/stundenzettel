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
  } else {
    // If no settings exist, create them with default values
    await setUserSettings(userId, defaultSettings)
    return defaultSettings
  }
}

export const setUserSettings = async (
  userId: string,
  settings: Partial<UserSettings>,
): Promise<void> => {
  if (!userId) throw new Error('User not authenticated')

  // Filter out undefined values to prevent Firestore validation errors
  const cleanSettings = Object.fromEntries(
    Object.entries(settings).filter(
      ([, value]) => value !== undefined && value !== null,
    ),
  )

  const docRef = doc(db, 'users', userId, 'settings', 'general')
  await setDoc(docRef, cleanSettings, { merge: true })
}
