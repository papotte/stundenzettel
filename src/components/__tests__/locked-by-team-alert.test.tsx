import React from 'react'

import { render, screen } from '@jest-setup'

import { LockedByTeamAlert } from '../locked-by-team-alert'

describe('LockedByTeamAlert', () => {
  it('shows default intro and forbidden text when showChangeText is false', () => {
    render(<LockedByTeamAlert showChangeText={false} />)

    expect(screen.getByText('settings.managedByTeam')).toBeInTheDocument()
    expect(
      screen.getByText('settings.teamManagementForbidden'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('settings.teamManagementAllowed'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'settings.openTeamOptions' }),
    ).not.toBeInTheDocument()
  })

  it('shows default intro, allowed hint, and team options link when showChangeText is true', () => {
    render(<LockedByTeamAlert showChangeText={true} />)

    expect(screen.getByText('settings.managedByTeam')).toBeInTheDocument()
    expect(
      screen.queryByText('settings.teamManagementForbidden'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText('settings.teamManagementAllowed'),
    ).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'settings.openTeamOptions' })
    expect(link).toHaveAttribute('href', '/team?tab=team-settings')
  })

  it('uses message prop instead of default intro when provided', () => {
    render(
      <LockedByTeamAlert showChangeText={false} message="Custom intro copy" />,
    )

    expect(screen.getByText('Custom intro copy')).toBeInTheDocument()
    expect(screen.queryByText('settings.managedByTeam')).not.toBeInTheDocument()
  })
})
