import { render, screen } from '@testing-library/react'

import { TeamInvitationEmail } from '../team-invitation-email'

describe('TeamInvitationEmail', () => {
  const defaultProps = {
    invitationLink: 'https://example.com/invitation/123',
    heading: 'Team Invitation',
    body: 'John Doe has invited you to join the team "Test Team" as a member.',
    acceptButtonText: 'Accept or Decline Invitation',
    expiryText: 'Important: This invitation will expire in 7 days.',
    ignoreText:
      'If you did not expect this invitation, you can safely ignore this email.',
  }

  it('should render team invitation email with all required information', () => {
    render(<TeamInvitationEmail {...defaultProps} />)

    expect(screen.getByText('Team Invitation')).toBeInTheDocument()
    expect(
      screen.getByText(
        'John Doe has invited you to join the team "Test Team" as a member.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Accept or Decline Invitation')).toBeInTheDocument()
    expect(
      screen.getByText('Important: This invitation will expire in 7 days.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /If you did not expect this invitation, you can safely ignore this email/,
      ),
    ).toBeInTheDocument()
  })

  it('should render invitation link with correct href', () => {
    render(<TeamInvitationEmail {...defaultProps} />)

    const invitationLink = screen.getByText('Accept or Decline Invitation')
    expect(invitationLink).toHaveAttribute(
      'href',
      'https://example.com/invitation/123',
    )
  })

  it('should render invitation link with correct styling', () => {
    render(<TeamInvitationEmail {...defaultProps} />)

    const invitationLink = screen.getByText('Accept or Decline Invitation')
    expect(invitationLink).toHaveStyle({
      backgroundColor: '#389457',
      color: 'white',
      padding: '12px 24px',
      textDecoration: 'none',
      borderRadius: '4px',
      display: 'inline-block',
    })
  })

  it('should handle different role types in body', () => {
    const adminProps = {
      ...defaultProps,
      body: 'John Doe has invited you to join the team "Test Team" as an admin.',
    }

    render(<TeamInvitationEmail {...adminProps} />)

    expect(
      screen.getByText(
        'John Doe has invited you to join the team "Test Team" as an admin.',
      ),
    ).toBeInTheDocument()
  })

  it('should handle different team names in body', () => {
    const customTeamProps = {
      ...defaultProps,
      body: 'John Doe has invited you to join the team "Awesome Development Team" as a member.',
    }

    render(<TeamInvitationEmail {...customTeamProps} />)

    expect(
      screen.getByText(
        'John Doe has invited you to join the team "Awesome Development Team" as a member.',
      ),
    ).toBeInTheDocument()
  })

  it('should handle different inviter names in body', () => {
    const customInviterProps = {
      ...defaultProps,
      body: 'Jane Smith has invited you to join the team "Test Team" as a member.',
    }

    render(<TeamInvitationEmail {...customInviterProps} />)

    expect(
      screen.getByText(
        'Jane Smith has invited you to join the team "Test Team" as a member.',
      ),
    ).toBeInTheDocument()
  })

  it('should handle localized heading and texts', () => {
    const spanishProps = {
      invitationLink: 'https://example.com/invitation/123',
      heading: 'Invitación de equipo',
      body: 'Juan ha invitado a unirte al equipo "Test Team" como miembro.',
      acceptButtonText: 'Aceptar o rechazar invitación',
      expiryText: 'Importante: Esta invitación expirará en 7 días.',
      ignoreText:
        'Si no esperabas esta invitación, puedes ignorar este correo electrónico de forma segura.',
    }

    render(<TeamInvitationEmail {...spanishProps} />)

    expect(screen.getByText('Invitación de equipo')).toBeInTheDocument()
    expect(
      screen.getByText('Aceptar o rechazar invitación'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Importante: Esta invitación expirará en 7 días.'),
    ).toBeInTheDocument()
  })

  it('should have proper container styling', () => {
    const { container } = render(<TeamInvitationEmail {...defaultProps} />)

    const mainDiv = container.firstChild as HTMLElement
    expect(mainDiv).toHaveStyle({
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.6',
    })
  })

  it('should have proper footer styling', () => {
    render(<TeamInvitationEmail {...defaultProps} />)

    const footerText = screen.getByText(
      /If you did not expect this invitation, you can safely ignore this email/,
    )
    expect(footerText).toHaveStyle({
      color: '#666',
      fontSize: '12px',
    })
  })

  it('should render all text elements', () => {
    render(<TeamInvitationEmail {...defaultProps} />)

    expect(screen.getByText('Team Invitation')).toBeInTheDocument()
    expect(screen.getByText('Accept or Decline Invitation')).toBeInTheDocument()
    expect(
      screen.getByText('Important: This invitation will expire in 7 days.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /If you did not expect this invitation, you can safely ignore this email/,
      ),
    ).toBeInTheDocument()
  })

  it('should handle very long body text gracefully', () => {
    const longBodyProps = {
      ...defaultProps,
      body: 'Dr. Christopher Alexander Johnson-Williams III has invited you to join the team "This is a very long team name that might cause layout issues in the email template" as a member.',
    }

    render(<TeamInvitationEmail {...longBodyProps} />)

    expect(
      screen.getByText(
        'Dr. Christopher Alexander Johnson-Williams III has invited you to join the team "This is a very long team name that might cause layout issues in the email template" as a member.',
      ),
    ).toBeInTheDocument()
  })
})
