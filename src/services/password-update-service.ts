import * as firestoreService from './password-update-service.firestore'
import * as localService from './password-update-service.local'

const useMockService =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'test' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'

const service = useMockService ? localService : firestoreService

if (useMockService) {
  console.info(
    `Using local password update service (NEXT_PUBLIC_ENVIRONMENT=${process.env.NEXT_PUBLIC_ENVIRONMENT}).`,
  )
}

/**
 * Updates a user's password after verifying their current password.
 * This operation requires re-authentication for security.
 *
 * @param userId - The ID of the user updating their password
 * @param currentPassword - The user's current password for verification
 * @param newPassword - The new password to set
 * @returns Promise that resolves when password update is complete
 */
export const updateUserPassword = (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  return service.updateUserPassword(userId, currentPassword, newPassword)
}

/**
 * Checks if the current user signed up with email/password authentication.
 * Used to determine if password change functionality should be available.
 *
 * @param userId - The ID of the user to check
 * @returns Promise that resolves to true if user has password authentication
 */
export const hasPasswordAuthentication = (userId: string): Promise<boolean> => {
  return service.hasPasswordAuthentication(userId)
}
