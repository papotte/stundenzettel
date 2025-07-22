import * as firestoreService from './email-notification-service.firestore'
import * as localService from './email-notification-service.local'

const useMockService =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'test' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'

const service = useMockService ? localService : firestoreService

if (useMockService) {
  console.info(
    `Using local email notification service (NEXT_PUBLIC_ENVIRONMENT=${process.env.NEXT_PUBLIC_ENVIRONMENT}).`,
  )
}

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
