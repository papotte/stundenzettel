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

/**
 * Sends an email invitation when a user is invited to join a team.
 * This provides detailed invitation information to the invitee.
 *
 * @param invitation - The team invitation object
 * @param teamName - The name of the team
 * @param inviterName - The name of the person who sent the invitation
 * @param language - The preferred language for the email (default: 'en')
 * @returns Promise that resolves when email is sent
 */
export const sendTeamInvitationEmail = (
  invitation: import('@/lib/types').TeamInvitation,
  teamName: string,
  inviterName: string,
  language?: string,
): Promise<void> => {
  return service.sendTeamInvitationEmail(
    invitation,
    teamName,
    inviterName,
    language,
  )
}
