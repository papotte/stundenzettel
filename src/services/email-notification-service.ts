/**
 * Sends an email notification when a user changes their password.
 * This provides security notification to the user's email address.
 *
 * @param userEmail - The email address to send the notification to
 * @param userDisplayName - The display name of the user (optional)
 * @returns Promise that resolves when email is sent
 */
export const sendPasswordChangeNotification = async (
  userEmail: string,
  userDisplayName?: string | null,
): Promise<void> => {
  if (!userEmail) {
    throw new Error('User email is required for password change notification')
  }

  const response = await fetch('/api/emails/password-changed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: userEmail, displayName: userDisplayName }),
  })

  if (!response.ok) {
    let simpleMessage = 'Unexpected error'
    try {
      const data = await response.json()
      console.error('Failed to send password change email:', data)
      simpleMessage = (data?.message ||
        data?.name ||
        data?.type ||
        'Unexpected error') as string
    } catch {
      // ignore, keep default simpleMessage
    }
    throw new Error('Failed to send password change email: ' + simpleMessage)
  }
}

/**
 * Sends an email invitation when a user is invited to join a team.
 * This provides detailed invitation information to the invitee.
 *
 * @param invitation - The team invitation object
 * @param teamName - The name of the team
 * @param inviterName - The name of the person who sent the invitation
 * @returns Promise that resolves when email is sent
 */
export const sendTeamInvitationEmail = async (
  invitation: import('@/lib/types').TeamInvitation,
  teamName: string,
  inviterName: string,
): Promise<void> => {
  if (!invitation.email) {
    throw new Error('Invitation email is required')
  }
  if (!invitation.teamId || !invitation.id) {
    throw new Error('Team ID and invitation ID are required')
  }

  const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/team/invitation/${invitation.id}`

  const response = await fetch('/api/emails/team-invitation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: invitation.email,
      teamName,
      inviterName,
      invitationLink,
      role: invitation.role,
    }),
  })

  if (!response.ok) {
    let simpleMessage = 'Unexpected error'
    try {
      const data = await response.json()
      console.error('Failed to send team invitation email:', data)
      // Prefer human-readable message, fallback to name/type
      simpleMessage = (data?.message ||
        data?.name ||
        data?.type ||
        'Unexpected error') as string
    } catch {
      // ignore, keep default simpleMessage
    }
    throw new Error('Failed to send team invitation email: ' + simpleMessage)
  }
}
