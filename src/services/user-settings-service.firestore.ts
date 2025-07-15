import { doc, getDoc, setDoc } from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { UserSettings } from '@/lib/types'

const defaultSettings: UserSettings = {
  defaultWorkHours: 7,
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
  const docRef = doc(db, 'users', userId, 'settings', 'general')
  await setDoc(docRef, settings, { merge: true })
}
