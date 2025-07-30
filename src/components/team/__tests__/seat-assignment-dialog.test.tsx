import { render, screen } from '@testing-library/react'

import type { Subscription, TeamMember } from '@/lib/types'

import { SeatAssignmentDialog } from '../seat-assignment-dialog'

// Mock the services
jest.mock('@/services/team-service', () => ({
  assignSeat: jest.fn(),
  unassignSeat: jest.fn(),
}))

// Mock the hooks
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

const mockMembers: TeamMember[] = [
  {
    id: 'member1',
    email: 'member1@example.com',
    role: 'member',
    joinedAt: new Date('2024-01-01'),
    invitedBy: 'owner1',
  },
  {
    id: 'member2',
    email: 'member2@example.com',
    role: 'member',
    joinedAt: new Date('2024-01-02'),
    invitedBy: 'owner1',
    seatAssignment: {
      assignedAt: new Date('2024-01-15'),
      assignedBy: 'owner1',
      isActive: true,
    },
  },
  {
    id: 'owner1',
    email: 'owner1@example.com',
    role: 'owner',
    joinedAt: new Date('2024-01-01'),
    invitedBy: 'owner1',
    seatAssignment: {
      assignedAt: new Date('2024-01-01'),
      assignedBy: 'owner1',
      isActive: true,
    },
  },
]

const mockSubscription: Subscription = {
  stripeSubscriptionId: 'sub_123',
  stripeCustomerId: 'cus_123',
  status: 'active',
  currentPeriodStart: new Date('2024-01-01'),
  cancelAtPeriodEnd: false,
  priceId: 'price_123',
  quantity: 5,
  updatedAt: new Date('2024-01-01'),
}

describe('SeatAssignmentDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    teamId: 'team1',
    members: mockMembers,
    subscription: mockSubscription,
    currentUserId: 'owner1',
    onMembersChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the dialog with seat assignment information', () => {
    render(<SeatAssignmentDialog {...defaultProps} />)

    expect(screen.getByText('teams.seatAssignment')).toBeInTheDocument()
    expect(
      screen.getByText('teams.seatAssignmentDescription'),
    ).toBeInTheDocument()

    // Check seat usage summary
    expect(screen.getByText('2')).toBeInTheDocument() // Assigned seats (owner + member2)
    expect(screen.getByText('3')).toBeInTheDocument() // Available seats
    expect(screen.getByText('5')).toBeInTheDocument() // Total seats
  })

  it('shows seat status for each member', () => {
    render(<SeatAssignmentDialog {...defaultProps} />)

    // Member without seat assignment
    expect(screen.getByText('member1@example.com')).toBeInTheDocument()
    expect(screen.getByText('teams.noSeatAssigned')).toBeInTheDocument()

    // Member with seat assignment
    expect(screen.getByText('member2@example.com')).toBeInTheDocument()
    expect(screen.getAllByText('teams.seatAssigned')).toHaveLength(2) // member2 and owner
  })

  it('disables assign button when no seats available', () => {
    const subscriptionWithNoSeats = {
      ...mockSubscription,
      quantity: 1,
    }

    render(
      <SeatAssignmentDialog
        {...defaultProps}
        subscription={subscriptionWithNoSeats}
      />,
    )

    const assignButtons = screen.getAllByText('teams.assignSeat')
    assignButtons.forEach((button) => {
      expect(button).toBeDisabled()
    })
  })

  it('shows seat limit warning when no seats available', () => {
    const subscriptionWithNoSeats = {
      ...mockSubscription,
      quantity: 1,
    }

    render(
      <SeatAssignmentDialog
        {...defaultProps}
        subscription={subscriptionWithNoSeats}
      />,
    )

    expect(screen.getByText('teams.seatLimitReached')).toBeInTheDocument()
  })

  it('shows owner seat required message for owners with assigned seats', () => {
    render(<SeatAssignmentDialog {...defaultProps} />)

    // Owner should show "Owner seat required" instead of unassign button
    expect(screen.getByText('owner1@example.com')).toBeInTheDocument()
    expect(screen.getByText('teams.ownerSeatRequired')).toBeInTheDocument()
  })
})
