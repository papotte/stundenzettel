import * as teamService from '../team-service'
import * as firestoreService from '../team-service.firestore'
import * as localService from '../team-service.local'

// Mock the underlying services
jest.mock('../team-service.local')
jest.mock('../team-service.firestore')

const mockLocalService = localService as jest.Mocked<typeof localService>
const mockFirestoreService = firestoreService as jest.Mocked<
  typeof firestoreService
>

describe('TeamService', () => {
  const originalEnv = process.env.NEXT_PUBLIC_ENVIRONMENT

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment
    process.env.NEXT_PUBLIC_ENVIRONMENT = originalEnv
  })

  afterAll(() => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = originalEnv
  })

  describe('Service Selection Logic', () => {
    it('uses local service in test environment', async () => {
      // Mock local service response
      mockLocalService.createTeam.mockResolvedValue('team-123')
      mockLocalService.getTeam.mockResolvedValue({
        id: 'team-123',
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'user-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      })

      // Test that local service is called (since we're in test environment)
      const result = await teamService.createTeam(
        'Test Team',
        'Test Description',
        'user-123',
        'test@example.com',
      )

      expect(mockLocalService.createTeam).toHaveBeenCalledWith(
        'Test Team',
        'Test Description',
        'user-123',
        'test@example.com',
      )
      expect(mockFirestoreService.createTeam).not.toHaveBeenCalled()
      expect(result).toBe('team-123')
    })

    it('delegates all operations to the selected service', async () => {
      // Test that all operations delegate to the underlying service
      mockLocalService.getTeam.mockResolvedValue({
        id: 'team-123',
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'user-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      })

      const result = await teamService.getTeam('team-123')

      expect(mockLocalService.getTeam).toHaveBeenCalledWith('team-123')
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
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'test'
    })

    it('createTeam delegates to underlying service', async () => {
      mockLocalService.createTeam.mockResolvedValue('team-123')

      const result = await teamService.createTeam(
        'Test Team',
        'Test Description',
        'user-123',
        'test@example.com',
      )

      expect(mockLocalService.createTeam).toHaveBeenCalledWith(
        'Test Team',
        'Test Description',
        'user-123',
        'test@example.com',
      )
      expect(result).toBe('team-123')
    })

    it('getTeam delegates to underlying service', async () => {
      const mockTeam = {
        id: 'team-123',
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'user-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }
      mockLocalService.getTeam.mockResolvedValue(mockTeam)

      const result = await teamService.getTeam('team-123')

      expect(mockLocalService.getTeam).toHaveBeenCalledWith('team-123')
      expect(result).toBe(mockTeam)
    })

    it('updateTeam delegates to underlying service', async () => {
      mockLocalService.updateTeam.mockResolvedValue(undefined)

      await teamService.updateTeam('team-123', {
        name: 'Updated Team',
        description: 'Updated Description',
      })

      expect(mockLocalService.updateTeam).toHaveBeenCalledWith('team-123', {
        name: 'Updated Team',
        description: 'Updated Description',
      })
    })

    it('deleteTeam delegates to underlying service', async () => {
      mockLocalService.deleteTeam.mockResolvedValue(undefined)

      await teamService.deleteTeam('team-123')

      expect(mockLocalService.deleteTeam).toHaveBeenCalledWith('team-123')
    })
  })

  describe('Team Member Operations', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'test'
    })

    it('addTeamMember delegates to underlying service', async () => {
      mockLocalService.addTeamMember.mockResolvedValue(undefined)

      await teamService.addTeamMember(
        'team-123',
        'user-123',
        'member',
        'owner-123',
      )

      expect(mockLocalService.addTeamMember).toHaveBeenCalledWith(
        'team-123',
        'user-123',
        'member',
        'owner-123',
      )
    })

    it('getTeamMembers delegates to underlying service', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          email: 'member1@example.com',
          role: 'member' as const,
          joinedAt: new Date('2024-01-01'),
          invitedBy: 'owner-123',
        },
      ]
      mockLocalService.getTeamMembers.mockResolvedValue(mockMembers)

      const result = await teamService.getTeamMembers('team-123')

      expect(mockLocalService.getTeamMembers).toHaveBeenCalledWith('team-123')
      expect(result).toBe(mockMembers)
    })

    it('updateTeamMemberRole delegates to underlying service', async () => {
      mockLocalService.updateTeamMemberRole.mockResolvedValue(undefined)

      await teamService.updateTeamMemberRole('team-123', 'member-123', 'admin')

      expect(mockLocalService.updateTeamMemberRole).toHaveBeenCalledWith(
        'team-123',
        'member-123',
        'admin',
      )
    })

    it('removeTeamMember delegates to underlying service', async () => {
      mockLocalService.removeTeamMember.mockResolvedValue(undefined)

      await teamService.removeTeamMember('team-123', 'member-123')

      expect(mockLocalService.removeTeamMember).toHaveBeenCalledWith(
        'team-123',
        'member-123',
      )
    })
  })

  describe('Team Invitations', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'test'
    })

    it('createTeamInvitation delegates to underlying service', async () => {
      mockLocalService.createTeamInvitation.mockResolvedValue('invitation-123')

      const result = await teamService.createTeamInvitation(
        'team-123',
        'test@example.com',
        'member',
        'owner-123',
      )

      expect(mockLocalService.createTeamInvitation).toHaveBeenCalledWith(
        'team-123',
        'test@example.com',
        'member',
        'owner-123',
      )
      expect(result).toBe('invitation-123')
    })

    it('getTeamInvitations delegates to underlying service', async () => {
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
      mockLocalService.getTeamInvitations.mockResolvedValue(mockInvitations)

      const result = await teamService.getTeamInvitations('team-123')

      expect(mockLocalService.getTeamInvitations).toHaveBeenCalledWith(
        'team-123',
      )
      expect(result).toBe(mockInvitations)
    })

    it('getUserInvitations delegates to underlying service', async () => {
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
      mockLocalService.getUserInvitations.mockResolvedValue(mockInvitations)

      const result = await teamService.getUserInvitations('test@example.com')

      expect(mockLocalService.getUserInvitations).toHaveBeenCalledWith(
        'test@example.com',
      )
      expect(result).toBe(mockInvitations)
    })

    it('acceptTeamInvitation delegates to underlying service', async () => {
      mockLocalService.acceptTeamInvitation.mockResolvedValue(undefined)

      await teamService.acceptTeamInvitation(
        'invitation-123',
        'user-123',
        'test@example.com',
      )

      expect(mockLocalService.acceptTeamInvitation).toHaveBeenCalledWith(
        'invitation-123',
        'user-123',
        'test@example.com',
      )
    })

    it('declineTeamInvitation delegates to underlying service', async () => {
      mockLocalService.declineTeamInvitation.mockResolvedValue(undefined)

      await teamService.declineTeamInvitation('invitation-123')

      expect(mockLocalService.declineTeamInvitation).toHaveBeenCalledWith(
        'invitation-123',
      )
    })
  })

  describe('User Team Management', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'test'
    })

    it('getUserTeam delegates to underlying service', async () => {
      const mockTeam = {
        id: 'team-123',
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'user-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }
      mockLocalService.getUserTeam.mockResolvedValue(mockTeam)

      const result = await teamService.getUserTeam('user-123')

      expect(mockLocalService.getUserTeam).toHaveBeenCalledWith('user-123')
      expect(result).toBe(mockTeam)
    })
  })

  describe('Team Subscription', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'test'
    })

    it('getTeamSubscription delegates to underlying service', async () => {
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
      mockLocalService.getTeamSubscription.mockResolvedValue(mockSubscription)

      const result = await teamService.getTeamSubscription('team-123')

      expect(mockLocalService.getTeamSubscription).toHaveBeenCalledWith(
        'team-123',
      )
      expect(result).toBe(mockSubscription)
    })
  })

  describe('Real-time Listeners', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'test'
    })

    it('onTeamMembersChange delegates to underlying service', () => {
      const mockUnsubscribe = jest.fn()
      mockLocalService.onTeamMembersChange.mockReturnValue(mockUnsubscribe)
      const callback = jest.fn()

      const result = teamService.onTeamMembersChange('team-123', callback)

      expect(mockLocalService.onTeamMembersChange).toHaveBeenCalledWith(
        'team-123',
        callback,
      )
      expect(result).toBe(mockUnsubscribe)
    })

    it('onTeamSubscriptionChange delegates to underlying service', () => {
      const mockUnsubscribe = jest.fn()
      mockLocalService.onTeamSubscriptionChange.mockReturnValue(mockUnsubscribe)
      const callback = jest.fn()

      const result = teamService.onTeamSubscriptionChange('team-123', callback)

      expect(mockLocalService.onTeamSubscriptionChange).toHaveBeenCalledWith(
        'team-123',
        callback,
      )
      expect(result).toBe(mockUnsubscribe)
    })
  })

  describe('Service Architecture', () => {
    it('delegates all operations to the underlying service', async () => {
      // Test that the service acts as a proper facade
      mockLocalService.createTeam.mockResolvedValue('team-123')
      mockLocalService.getTeam.mockResolvedValue({
        id: 'team-123',
        name: 'Test Team',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      mockLocalService.updateTeam.mockResolvedValue(undefined)
      mockLocalService.deleteTeam.mockResolvedValue(undefined)

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

      expect(mockLocalService.createTeam).toHaveBeenCalledWith(
        'Test Team',
        'Description',
        'user-123',
        'test@example.com',
      )
      expect(mockLocalService.getTeam).toHaveBeenCalledWith('team-123')
      expect(mockLocalService.updateTeam).toHaveBeenCalledWith('team-123', {
        name: 'Updated Team',
      })
      expect(mockLocalService.deleteTeam).toHaveBeenCalledWith('team-123')
    })
  })
})
