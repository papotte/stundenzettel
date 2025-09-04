import * as teamService from '../team-service'
import * as firestoreService from '../team-service.firestore'

// Mock the Firestore service
jest.mock('../team-service.firestore')

const mockFirestoreService = firestoreService as jest.Mocked<
  typeof firestoreService
>

describe('TeamService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Service Selection Logic', () => {
    it('delegates all operations to the Firestore service', async () => {
      // Test that all operations delegate to the Firestore service
      mockFirestoreService.getTeam.mockResolvedValue({
        id: 'team-123',
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'user-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      })

      const result = await teamService.getTeam('team-123')

      expect(mockFirestoreService.getTeam).toHaveBeenCalledWith('team-123')
      expect(result).toEqual({
        id: 'team-123',
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'user-123',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
    })
  })

  describe('Team CRUD Operations', () => {
    it('createTeam delegates to Firestore service', async () => {
      mockFirestoreService.createTeam.mockResolvedValue('team-123')

      const result = await teamService.createTeam(
        'Test Team',
        'Test Description',
        'user-123',
        'test@example.com',
      )

      expect(mockFirestoreService.createTeam).toHaveBeenCalledWith(
        'Test Team',
        'Test Description',
        'user-123',
        'test@example.com',
      )
      expect(result).toBe('team-123')
    })

    it('getTeam delegates to Firestore service', async () => {
      const mockTeam = {
        id: 'team-123',
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'user-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }
      mockFirestoreService.getTeam.mockResolvedValue(mockTeam)

      const result = await teamService.getTeam('team-123')

      expect(mockFirestoreService.getTeam).toHaveBeenCalledWith('team-123')
      expect(result).toBe(mockTeam)
    })

    it('updateTeam delegates to Firestore service', async () => {
      mockFirestoreService.updateTeam.mockResolvedValue(undefined)

      await teamService.updateTeam('team-123', {
        name: 'Updated Team',
        description: 'Updated Description',
      })

      expect(mockFirestoreService.updateTeam).toHaveBeenCalledWith('team-123', {
        name: 'Updated Team',
        description: 'Updated Description',
      })
    })

    it('deleteTeam delegates to Firestore service', async () => {
      mockFirestoreService.deleteTeam.mockResolvedValue(undefined)

      await teamService.deleteTeam('team-123')

      expect(mockFirestoreService.deleteTeam).toHaveBeenCalledWith('team-123')
    })
  })

  describe('Team Member Operations', () => {
    it('addTeamMember delegates to Firestore service', async () => {
      mockFirestoreService.addTeamMember.mockResolvedValue(undefined)

      await teamService.addTeamMember(
        'team-123',
        'user-123',
        'member',
        'owner-123',
      )

      expect(mockFirestoreService.addTeamMember).toHaveBeenCalledWith(
        'team-123',
        'user-123',
        'member',
        'owner-123',
      )
    })

    it('getTeamMembers delegates to Firestore service', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          email: 'member1@example.com',
          role: 'member' as const,
          joinedAt: new Date('2024-01-01'),
          invitedBy: 'owner-123',
        },
      ]
      mockFirestoreService.getTeamMembers.mockResolvedValue(mockMembers)

      const result = await teamService.getTeamMembers('team-123')

      expect(mockFirestoreService.getTeamMembers).toHaveBeenCalledWith(
        'team-123',
      )
      expect(result).toBe(mockMembers)
    })

    it('updateTeamMemberRole delegates to Firestore service', async () => {
      mockFirestoreService.updateTeamMemberRole.mockResolvedValue(undefined)

      await teamService.updateTeamMemberRole('team-123', 'member-123', 'admin')

      expect(mockFirestoreService.updateTeamMemberRole).toHaveBeenCalledWith(
        'team-123',
        'member-123',
        'admin',
      )
    })

    it('removeTeamMember delegates to Firestore service', async () => {
      mockFirestoreService.removeTeamMember.mockResolvedValue(undefined)

      await teamService.removeTeamMember('team-123', 'member-123')

      expect(mockFirestoreService.removeTeamMember).toHaveBeenCalledWith(
        'team-123',
        'member-123',
      )
    })
  })

  describe('Team Invitations', () => {
    it('createTeamInvitation delegates to Firestore service', async () => {
      mockFirestoreService.createTeamInvitation.mockResolvedValue(
        'invitation-123',
      )

      const result = await teamService.createTeamInvitation(
        'team-123',
        'test@example.com',
        'member',
        'owner-123',
      )

      expect(mockFirestoreService.createTeamInvitation).toHaveBeenCalledWith(
        'team-123',
        'test@example.com',
        'member',
        'owner-123',
      )
      expect(result).toBe('invitation-123')
    })

    it('getTeamInvitations delegates to Firestore service', async () => {
      const mockInvitations = [
        {
          id: 'invitation-1',
          teamId: 'team-123',
          email: 'test@example.com',
          role: 'member' as const,
          invitedBy: 'owner-123',
          invitedAt: new Date('2024-01-01'),
          expiresAt: new Date('2024-01-08'),
          status: 'pending' as const,
        },
      ]
      mockFirestoreService.getTeamInvitations.mockResolvedValue(mockInvitations)

      const result = await teamService.getTeamInvitations('team-123')

      expect(mockFirestoreService.getTeamInvitations).toHaveBeenCalledWith(
        'team-123',
      )
      expect(result).toBe(mockInvitations)
    })

    it('getUserInvitations delegates to Firestore service', async () => {
      const mockInvitations = [
        {
          id: 'invitation-1',
          teamId: 'team-123',
          email: 'test@example.com',
          role: 'member' as const,
          invitedBy: 'owner-123',
          invitedAt: new Date('2024-01-01'),
          expiresAt: new Date('2024-01-08'),
          status: 'pending' as const,
        },
      ]
      mockFirestoreService.getUserInvitations.mockResolvedValue(mockInvitations)

      const result = await teamService.getUserInvitations('test@example.com')

      expect(mockFirestoreService.getUserInvitations).toHaveBeenCalledWith(
        'test@example.com',
      )
      expect(result).toBe(mockInvitations)
    })

    it('acceptTeamInvitation delegates to Firestore service', async () => {
      mockFirestoreService.acceptTeamInvitation.mockResolvedValue(undefined)

      await teamService.acceptTeamInvitation(
        'invitation-123',
        'user-123',
        'test@example.com',
      )

      expect(mockFirestoreService.acceptTeamInvitation).toHaveBeenCalledWith(
        'invitation-123',
        'user-123',
        'test@example.com',
      )
    })

    it('declineTeamInvitation delegates to Firestore service', async () => {
      mockFirestoreService.declineTeamInvitation.mockResolvedValue(undefined)

      await teamService.declineTeamInvitation('invitation-123')

      expect(mockFirestoreService.declineTeamInvitation).toHaveBeenCalledWith(
        'invitation-123',
      )
    })
  })

  describe('User Team Management', () => {
    it('getUserTeam delegates to Firestore service', async () => {
      const mockTeam = {
        id: 'team-123',
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'user-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }
      mockFirestoreService.getUserTeam.mockResolvedValue(mockTeam)

      const result = await teamService.getUserTeam('user-123')

      expect(mockFirestoreService.getUserTeam).toHaveBeenCalledWith('user-123')
      expect(result).toBe(mockTeam)
    })
  })

  describe('Team Subscription', () => {
    it('getTeamSubscription delegates to Firestore service', async () => {
      const mockSubscription = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active' as const,
        currentPeriodStart: new Date('2024-01-01'),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        quantity: 5,
        updatedAt: new Date('2024-01-01'),
        planName: 'Team Plan',
        planDescription: 'Team subscription',
      }
      mockFirestoreService.getTeamSubscription.mockResolvedValue(
        mockSubscription,
      )

      const result = await teamService.getTeamSubscription('team-123')

      expect(mockFirestoreService.getTeamSubscription).toHaveBeenCalledWith(
        'team-123',
      )
      expect(result).toBe(mockSubscription)
    })
  })

  describe('Real-time Listeners', () => {
    it('onTeamMembersChange delegates to Firestore service', () => {
      const mockUnsubscribe = jest.fn()
      mockFirestoreService.onTeamMembersChange.mockReturnValue(mockUnsubscribe)
      const callback = jest.fn()

      const result = teamService.onTeamMembersChange('team-123', callback)

      expect(mockFirestoreService.onTeamMembersChange).toHaveBeenCalledWith(
        'team-123',
        callback,
      )
      expect(result).toBe(mockUnsubscribe)
    })

    it('onTeamSubscriptionChange delegates to Firestore service', () => {
      const mockUnsubscribe = jest.fn()
      mockFirestoreService.onTeamSubscriptionChange.mockReturnValue(
        mockUnsubscribe,
      )
      const callback = jest.fn()

      const result = teamService.onTeamSubscriptionChange('team-123', callback)

      expect(
        mockFirestoreService.onTeamSubscriptionChange,
      ).toHaveBeenCalledWith('team-123', callback)
      expect(result).toBe(mockUnsubscribe)
    })
  })

  describe('Service Architecture', () => {
    it('delegates all operations to the Firestore service', async () => {
      // Test that the service acts as a proper facade
      mockFirestoreService.createTeam.mockResolvedValue('team-123')
      mockFirestoreService.getTeam.mockResolvedValue({
        id: 'team-123',
        name: 'Test Team',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      mockFirestoreService.updateTeam.mockResolvedValue(undefined)
      mockFirestoreService.deleteTeam.mockResolvedValue(undefined)

      // Test all CRUD operations delegate correctly
      await teamService.createTeam(
        'Test Team',
        'Description',
        'user-123',
        'test@example.com',
      )
      await teamService.getTeam('team-123')
      await teamService.updateTeam('team-123', { name: 'Updated Team' })
      await teamService.deleteTeam('team-123')

      expect(mockFirestoreService.createTeam).toHaveBeenCalledWith(
        'Test Team',
        'Description',
        'user-123',
        'test@example.com',
      )
      expect(mockFirestoreService.getTeam).toHaveBeenCalledWith('team-123')
      expect(mockFirestoreService.updateTeam).toHaveBeenCalledWith('team-123', {
        name: 'Updated Team',
      })
      expect(mockFirestoreService.deleteTeam).toHaveBeenCalledWith('team-123')
    })
  })
})
