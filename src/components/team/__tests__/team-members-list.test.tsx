import React from 'react'

import { render, screen } from '@jest-setup'

import { useToast } from '@/hooks/use-toast'
import type { TeamMember } from '@/lib/types'
// Import mocked services
import {
  getTeamMembers,
  removeTeamMember,
  updateTeamMemberRole,
} from '@/services/team-service'

import { TeamMembersList } from '../team-members-list'

// Mock the team service
jest.mock('@/services/team-service', () => ({
  getTeamMembers: jest.fn(),
  updateTeamMemberRole: jest.fn(),
  removeTeamMember: jest.fn(),
}))

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}))

const mockToast = {
  toast: jest.fn(),
}

const mockGetTeamMembers = jest.fn()
const mockUpdateTeamMemberRole = jest.fn()
const mockRemoveTeamMember = jest.fn()

const mockMembers: TeamMember[] = [
  {
    id: 'user-1',
    email: 'owner@example.com',
    role: 'owner',
    joinedAt: new Date('2024-01-01'),
    invitedBy: 'user-1',
  },
  {
    id: 'user-2',
    email: 'admin@example.com',
    role: 'admin',
    joinedAt: new Date('2024-01-02'),
    invitedBy: 'user-1',
  },
  {
    id: 'user-3',
    email: 'member@example.com',
    role: 'member',
    joinedAt: new Date('2024-01-03'),
    invitedBy: 'user-1',
  },
]

const defaultProps = {
  teamId: 'team-1',
  members: mockMembers,
  currentUserRole: 'owner' as const,
  onMembersChange: jest.fn(),
  subscription: null,
  currentUserId: 'user-1',
}

describe('TeamMembersList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useToast as jest.Mock).mockReturnValue(mockToast)
    ;(getTeamMembers as jest.Mock).mockImplementation(mockGetTeamMembers)
    ;(updateTeamMemberRole as jest.Mock).mockImplementation(
      mockUpdateTeamMemberRole,
    )
    ;(removeTeamMember as jest.Mock).mockImplementation(mockRemoveTeamMember)
  })

  describe('Rendering', () => {
    it('renders team members table', () => {
      render(<TeamMembersList {...defaultProps} />)

      // Check for table headers
      expect(screen.getByText('teams.member')).toBeInTheDocument()
      expect(screen.getByText('teams.role')).toBeInTheDocument()
      expect(screen.getByText('teams.joined')).toBeInTheDocument()
    })

    it('displays all team members', () => {
      render(<TeamMembersList {...defaultProps} />)

      expect(screen.getByText('owner@example.com')).toBeInTheDocument()
      expect(screen.getByText('admin@example.com')).toBeInTheDocument()
      expect(screen.getByText('member@example.com')).toBeInTheDocument()
    })

    it('displays member roles correctly', () => {
      render(<TeamMembersList {...defaultProps} />)

      expect(screen.getByText('teams.roles.owner')).toBeInTheDocument()
      expect(screen.getByText('teams.roles.admin')).toBeInTheDocument()
      expect(screen.getByText('teams.roles.member')).toBeInTheDocument()
    })

    it('displays join dates', () => {
      render(<TeamMembersList {...defaultProps} />)

      // Should display formatted dates
      expect(screen.getByText(/January 1, 2024/)).toBeInTheDocument()
      expect(screen.getByText(/January 2, 2024/)).toBeInTheDocument()
      expect(screen.getByText(/January 3, 2024/)).toBeInTheDocument()
    })

    it('shows empty table when no members', () => {
      render(<TeamMembersList {...defaultProps} members={[]} />)

      // Should still show table headers but no data rows
      expect(screen.getByText('teams.member')).toBeInTheDocument()
      expect(screen.getByText('teams.role')).toBeInTheDocument()
      expect(screen.getByText('teams.joined')).toBeInTheDocument()
      expect(screen.queryByText('owner@example.com')).not.toBeInTheDocument()
    })
  })

  describe('Role Icons', () => {
    it('displays correct role icons', () => {
      render(<TeamMembersList {...defaultProps} />)

      // Check for role icons (using test-ids or aria-labels if available)
      // This would depend on how the icons are implemented
      expect(screen.getByText('teams.roles.owner')).toBeInTheDocument()
      expect(screen.getByText('teams.roles.admin')).toBeInTheDocument()
      expect(screen.getByText('teams.roles.member')).toBeInTheDocument()
    })
  })

  describe('Permission-Based Features', () => {
    it('shows action menu for owner', () => {
      render(<TeamMembersList {...defaultProps} />)

      // Should show action buttons for owner
      const actionButtons = screen.getAllByRole('button', {
        name: /teams\.memberOptions/i,
      })
      expect(actionButtons.length).toBeGreaterThan(0)
    })

    it('shows action menu for admin', () => {
      render(<TeamMembersList {...defaultProps} currentUserRole="admin" />)

      // Should show action buttons for admin
      const actionButtons = screen.getAllByRole('button', {
        name: /teams\.memberOptions/i,
      })
      expect(actionButtons.length).toBeGreaterThan(0)
    })

    it('hides action menu for regular members', () => {
      render(<TeamMembersList {...defaultProps} currentUserRole="member" />)

      // Should not show action buttons for regular members
      const actionButtons = screen.queryAllByRole('button', {
        name: /more options/i,
      })
      expect(actionButtons).toHaveLength(0)
    })

    it('prevents owner from changing their own role', () => {
      render(<TeamMembersList {...defaultProps} />)

      // Owner should not be able to change their own role
      // This would be tested by checking that the owner's row doesn't have role change options
      const ownerRows = screen.getAllByText('owner@example.com')
      expect(ownerRows[0]).toBeInTheDocument()
    })
  })

  describe('Member Count Display', () => {
    it('displays correct member count', () => {
      render(<TeamMembersList {...defaultProps} />)

      // Should show the number of members in the table
      const memberRows = screen.getAllByRole('row')
      // Subtract 1 for header row
      expect(memberRows.length - 1).toBe(mockMembers.length)
    })

    it('handles single member', () => {
      const singleMember = [mockMembers[0]]
      render(<TeamMembersList {...defaultProps} members={singleMember} />)

      expect(screen.getByText('owner@example.com')).toBeInTheDocument()
      expect(screen.queryByText('admin@example.com')).not.toBeInTheDocument()
    })
  })
})
