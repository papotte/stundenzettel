import * as firestoreService from './user-settings-service.firestore'
import * as localService from './user-settings-service.local'
import type { UserSettings } from '@/lib/types'

const useMockService =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'test' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'

const service = useMockService ? localService : firestoreService

if (useMockService) {
  console.log(
    `Using local user settings service (NEXT_PUBLIC_ENVIRONMENT=${process.env.NEXT_PUBLIC_ENVIRONMENT}).`,
  )
}

export const getUserSettings = (userId: string): Promise<UserSettings> => {
  return service.getUserSettings(userId)
}

export const setUserSettings = (
  userId: string,
  settings: UserSettings,
): Promise<void> => {
  return service.setUserSettings(userId, settings)
}
