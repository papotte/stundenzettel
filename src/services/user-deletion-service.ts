import * as firestoreService from './user-deletion-service.firestore'

// Always use Firestore service - local service has been removed
// The environment-specific database selection is handled in firebase.ts
const service = firestoreService

const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'production'
console.info(
  `Using Firestore user deletion service for environment '${environment}'`,
)

/**
 * Permanently deletes a user account and all associated data.
 * This operation cannot be undone.
 *
 * @param userId - The ID of the user to delete
 * @param password - The user's current password for confirmation
 * @returns Promise that resolves when deletion is complete
 */
export const deleteUserAccount = (
  userId: string,
  password: string,
): Promise<void> => {
  return service.deleteUserAccount(userId, password)
}

/**
 * Permanently deletes a user account and all associated data with email confirmation.
 * This operation cannot be undone.
 * Used as fallback for users without passwords (e.g., Google OAuth users).
 *
 * @param userId - The ID of the user to delete
 * @param email - The user's email for confirmation
 * @returns Promise that resolves when deletion is complete
 */
export const deleteUserAccountWithEmail = (
  userId: string,
  email: string,
): Promise<void> => {
  return service.deleteUserAccountWithEmail(userId, email)
}

/**
 * Permanently deletes a user account using Google re-authentication.
 * This operation cannot be undone.
 * Used for users who signed in with Google.
 *
 * @param userId - The ID of the user to delete
 * @returns Promise that resolves when deletion is complete
 */
export const deleteUserAccountWithGoogle = (userId: string): Promise<void> => {
  return service.deleteUserAccountWithGoogle(userId)
}
