import { render, screen } from '@testing-library/react'

import { TeamInvitationEmail } from '../team-invitation-email'

describe('TeamInvitationEmail', () => {
  const defaultProps = {
    teamName: 'Test Team',
    inviterName: 'John Doe',
    invitationLink: 'https://example.com/invitation/123',
    role: 'member',
  }

  it('should render team invitation email with all required information', () => {
    render(<TeamInvitationEmail {...defaultProps} />)

    expect(screen.getByText('Team Invitation')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('"Test Team"')).toBeInTheDocument()
    expect(screen.getByText('member')).toBeInTheDocument()
    expect(screen.getByText('Accept or Decline Invitation')).toBeInTheDocument()
    expect(screen.getByText('Important:')).toBeInTheDocument()
    expect(
      screen.getByText('This invitation will expire in 7 days.'),
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

  it('should handle different role types', () => {
    const adminProps = {
      ...defaultProps,
      role: 'admin',
    }

    render(<TeamInvitationEmail {...adminProps} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('"Test Team"')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('should handle different team names', () => {
    const customTeamProps = {
      ...defaultProps,
      teamName: 'Awesome Development Team',
    }

    render(<TeamInvitationEmail {...customTeamProps} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('"Awesome Development Team"')).toBeInTheDocument()
    expect(screen.getByText('member')).toBeInTheDocument()
  })

  it('should handle different inviter names', () => {
    const customInviterProps = {
      ...defaultProps,
      inviterName: 'Jane Smith',
    }

    render(<TeamInvitationEmail {...customInviterProps} />)

    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('"Test Team"')).toBeInTheDocument()
    expect(screen.getByText('member')).toBeInTheDocument()
  })

  it('should handle special characters in team name', () => {
    const specialTeamProps = {
      ...defaultProps,
      teamName: 'Team "Special" & Co.',
    }

    render(<TeamInvitationEmail {...specialTeamProps} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('"Team "Special" & Co."')).toBeInTheDocument()
    expect(screen.getByText('member')).toBeInTheDocument()
  })

  it('should handle special characters in inviter name', () => {
    const specialInviterProps = {
      ...defaultProps,
      inviterName: 'José María',
    }

    render(<TeamInvitationEmail {...specialInviterProps} />)

    expect(screen.getByText('José María')).toBeInTheDocument()
    expect(screen.getByText('"Test Team"')).toBeInTheDocument()
    expect(screen.getByText('member')).toBeInTheDocument()
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

    // Check that all expected text elements are present
    expect(screen.getByText('Team Invitation')).toBeInTheDocument()
    expect(screen.getByText('Accept or Decline Invitation')).toBeInTheDocument()
    expect(screen.getByText('Important:')).toBeInTheDocument()
    expect(
      screen.getByText('This invitation will expire in 7 days.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /If you did not expect this invitation, you can safely ignore this email/,
      ),
    ).toBeInTheDocument()
  })

  it('should handle empty strings gracefully', () => {
    const emptyProps = {
      teamName: '',
      inviterName: '',
      invitationLink: 'https://example.com/invitation/123',
      role: '',
    }

    render(<TeamInvitationEmail {...emptyProps} />)

    expect(screen.getByText('Team Invitation')).toBeInTheDocument()
    expect(screen.getByText('Accept or Decline Invitation')).toBeInTheDocument()
  })

  it('should handle very long team names', () => {
    const longTeamProps = {
      ...defaultProps,
      teamName:
        'This is a very long team name that might cause layout issues in the email template',
    }

    render(<TeamInvitationEmail {...longTeamProps} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(
      screen.getByText(
        '"This is a very long team name that might cause layout issues in the email template"',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('member')).toBeInTheDocument()
  })

  it('should handle very long inviter names', () => {
    const longInviterProps = {
      ...defaultProps,
      inviterName: 'Dr. Christopher Alexander Johnson-Williams III',
    }

    render(<TeamInvitationEmail {...longInviterProps} />)

    expect(
      screen.getByText('Dr. Christopher Alexander Johnson-Williams III'),
    ).toBeInTheDocument()
    expect(screen.getByText('"Test Team"')).toBeInTheDocument()
    expect(screen.getByText('member')).toBeInTheDocument()
  })
})
