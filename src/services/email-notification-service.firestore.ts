/**
 * Firebase implementation of email notification service.
 * This integrates with Firebase Functions and Resend to send actual emails.
 */

import { getFunctions, httpsCallable } from 'firebase/functions'
import type { TeamInvitation } from '@/lib/types'

/**
 * Sends an email notification when a user changes their password.
 * This is a placeholder implementation that would integrate with Firebase Functions.
 */
export const sendPasswordChangeNotification = async (
  userEmail: string,
  userDisplayName?: string | null,
): Promise<void> => {
  if (!userEmail) {
    throw new Error('User email is required for password change notification')
  }

  // In a real implementation, this would:
  // 1. Call a Firebase Function to send the email
  // 2. Use a service like SendGrid, Mailgun, or Firebase Extensions
  // 3. Send a properly formatted email notification

  console.info(
    `Password change notification would be sent to ${userEmail} for user ${userDisplayName || 'Unknown'}`,
  )

  // For now, we'll just log the action
  // In production, you would implement actual email sending here

  // Simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 100))
}

/**
 * Sends an email invitation when a user is invited to join a team.
 * This calls a Firebase Function that uses Resend to send actual emails.
 */
export const sendTeamInvitationEmail = async (
  invitation: TeamInvitation,
  teamName: string,
  inviterName: string,
  language: string = 'en',
): Promise<void> => {
  if (!invitation.email) {
    throw new Error('Invitation email is required')
  }

  if (!invitation.teamId || !invitation.id) {
    throw new Error('Team ID and invitation ID are required')
  }

  // Call the Firebase Function to send the email
  // Configure functions to use the correct region (europe-west1)
  const functions = getFunctions(undefined, 'europe-west1')
  const sendEmailFunction = httpsCallable(functions, 'sendTeamInvitationEmail')

  console.info(
    `Calling Firebase Function to send invitation email to ${invitation.email}`,
    {
      invitationId: invitation.id,
      teamId: invitation.teamId,
      teamName,
      inviterName,
      role: invitation.role,
      language,
    },
  )

  try {
    const result = await sendEmailFunction({
      invitationId: invitation.id,
      teamId: invitation.teamId,
      email: invitation.email,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
    })

    console.info('Firebase Function call successful', result.data)
  } catch (error) {
    console.error('Firebase Function call failed', error)
    throw error // Re-throw to let the calling code handle the error
  }
}
