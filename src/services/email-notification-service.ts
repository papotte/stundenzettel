import * as firestoreService from './email-notification-service.firestore'

// Always use Firestore service - local service has been removed
// The environment-specific database selection is handled in firebase.ts
const service = firestoreService

const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'production'
console.info(
  `Using Firestore email notification service for environment '${environment}'`,
)

/**
 * Sends an email notification when a user changes their password.
 * This provides security notification to the user's email address.
 *
 * @param userEmail - The email address to send the notification to
 * @param userDisplayName - The display name of the user (optional)
 * @returns Promise that resolves when email is sent
 */
export const sendPasswordChangeNotification = (
  userEmail: string,
  userDisplayName?: string | null,
): Promise<void> => {
  return service.sendPasswordChangeNotification(userEmail, userDisplayName)
}
