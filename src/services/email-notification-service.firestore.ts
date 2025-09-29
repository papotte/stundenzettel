/**
 * Firebase implementation of email notification service.
 * This sends emails directly from the client-side service using secure patterns.
 */

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
 * This uses a direct API approach to send emails without Firebase Functions.
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
    `Sending invitation email directly to ${invitation.email}`,
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

    // Get the Resend API key from environment
    const resendApiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY
    if (!resendApiKey) {
      throw new Error('NEXT_PUBLIC_RESEND_API_KEY environment variable is not set')
    }

    // Send email using direct Resend API call
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TimeWise Tracker <noreply@papotte.dev>',
        to: [invitation.email],
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Resend API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
    }

    const result = await response.json()

    console.info('Email sent successfully via Resend API', {
      invitationId: invitation.id,
      email: invitation.email,
      resendId: result.id,
    })

  } catch (error) {
    console.error('Failed to send invitation email:', error)
    throw error // Re-throw to let the calling code handle the error
  }
}
