import type { UserSettings } from '@/lib/types'

import * as firestoreService from './user-settings-service.firestore'

// Always use Firestore service - local service has been removed
// The environment-specific database selection is handled in firebase.ts
const service = firestoreService

const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'production'
console.info(
  `Using Firestore user settings service for environment '${environment}'`,
)

export const getUserSettings = (userId: string): Promise<UserSettings> => {
  return service.getUserSettings(userId)
}

export const setUserSettings = (
  userId: string,
  settings: UserSettings,
): Promise<void> => {
  return service.setUserSettings(userId, settings)
}
