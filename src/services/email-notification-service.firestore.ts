/**
 * Firebase implementation of email notification service.
 * This sends emails directly using the Resend library for better type safety and error handling.
 */

import { Resend } from 'resend'
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
 * This uses the Resend library for better type safety and error handling.
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

  // Create invitation link
  const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/team/invitation/${invitation.id}`

  console.info(
    `Sending invitation email using Resend library to ${invitation.email}`,
    {
      invitationId: invitation.id,
      teamId: invitation.teamId,
      teamName,
      inviterName,
      role: invitation.role,
      language,
      invitationLink,
    },
  )

  try {
    // Get the Resend API key from environment
    const resendApiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY
    if (!resendApiKey) {
      throw new Error('NEXT_PUBLIC_RESEND_API_KEY environment variable is not set')
    }

    // Initialize Resend client
    const resend = new Resend(resendApiKey)

    // Create email content
    const emailSubject = `Invitation to join team "${teamName}"`
    const emailHtml = `
      <h2>Team Invitation</h2>
      <p><strong>${inviterName}</strong> has invited you to join the team <strong>"${teamName}"</strong> as a <strong>${invitation.role}</strong>.</p>
      
      <p>
        <a href="${invitationLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Accept or Decline Invitation
        </a>
      </p>
      
      <p><strong>Important:</strong> This invitation will expire in 7 days.</p>
      
      <hr>
      <p style="color: #666; font-size: 12px;">
        If you did not expect this invitation, you can safely ignore this email.
      </p>
    `

    const emailText = `
${inviterName} has invited you to join the team "${teamName}" as a ${invitation.role}.

Click the link below to accept or decline this invitation:
${invitationLink}

This invitation will expire in 7 days.

If you did not expect this invitation, you can safely ignore this email.
    `

    // Send email using Resend library
    const { data, error } = await resend.emails.send({
      from: 'TimeWise Tracker <noreply@papotte.dev>',
      to: [invitation.email],
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    })

    if (error) {
      throw new Error(`Resend API error: ${error.message}`)
    }

    console.info('Email sent successfully via Resend library', {
      invitationId: invitation.id,
      email: invitation.email,
      resendId: data?.id,
    })

  } catch (error) {
    console.error('Failed to send invitation email:', error)
    throw error // Re-throw to let the calling code handle the error
  }
}
