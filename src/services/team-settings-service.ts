import { doc, getDoc, setDoc } from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { TeamSettings } from '@/lib/types'

const defaultTeamSettings: TeamSettings = {
  defaultDriverCompensationPercent: 100,
  defaultPassengerCompensationPercent: 100,
  allowMemberOverrideCompensation: true,
  exportIncludeDriverTime: true,
  exportIncludePassengerTime: true,
  allowMemberOverrideExport: true,
}

export const getTeamSettings = async (
  teamId: string,
): Promise<TeamSettings> => {
  if (!teamId) return defaultTeamSettings
  const docRef = doc(db, 'teams', teamId, 'settings', 'general')
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    return {
      ...defaultTeamSettings,
      ...docSnap.data(),
    } as TeamSettings
  }
  return defaultTeamSettings
}

export const setTeamSettings = async (
  teamId: string,
  settings: Partial<TeamSettings>,
): Promise<void> => {
  if (!teamId) throw new Error('Team ID is required')

  const cleanSettings = Object.fromEntries(
    Object.entries(settings).filter(([, value]) => value !== undefined),
  )

  const docRef = doc(db, 'teams', teamId, 'settings', 'general')
  await setDoc(docRef, cleanSettings, { merge: true })
}
