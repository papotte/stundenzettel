import * as React from 'react'

interface TeamInvitationEmailProps {
  teamName: string
  inviterName: string
  invitationLink: string
  role: string
}

export function TeamInvitationEmail({
  teamName,
  inviterName,
  invitationLink,
  role,
}: TeamInvitationEmailProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: 1.6 }}>
      <h2>Team Invitation</h2>
      <p>
        <strong>{inviterName}</strong> has invited you to join the team{' '}
        <strong>&quot;{teamName}&quot;</strong> as a <strong>{role}</strong>.
      </p>
      <p>
        <a
          href={invitationLink}
          style={{
            backgroundColor: '#389457',
            color: 'white',
            padding: '12px 24px',
            textDecoration: 'none',
            borderRadius: 4,
            display: 'inline-block',
          }}
        >
          Accept or Decline Invitation
        </a>
      </p>
      <p>
        <strong>Important:</strong> This invitation will expire in 7 days.
      </p>
      <hr />
      <p style={{ color: '#666', fontSize: 12 }}>
        If you did not expect this invitation, you can safely ignore this email.
      </p>
    </div>
  )
}
