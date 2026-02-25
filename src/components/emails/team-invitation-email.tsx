import * as React from 'react'

interface TeamInvitationEmailProps {
  invitationLink: string
  heading: string
  body: string
  acceptButtonText: string
  expiryText: string
  ignoreText: string
}

export function TeamInvitationEmail({
  invitationLink,
  heading,
  body,
  acceptButtonText,
  expiryText,
  ignoreText,
}: TeamInvitationEmailProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: 1.6 }}>
      <h2>{heading}</h2>
      <p>{body}</p>
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
          {acceptButtonText}
        </a>
      </p>
      <p>{expiryText}</p>
      <hr />
      <p style={{ color: '#666', fontSize: 12 }}>{ignoreText}</p>
    </div>
  )
}
