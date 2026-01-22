import type { Team, TeamMember } from '@/lib/types'
import { getTeam, getTeamMembers } from '@/services/team-service'

import { verifyTeamAccess, verifyTeamOwnership } from '../team-auth'

// Mock the team service
jest.mock('@/services/team-service')
const mockGetTeamMembers = getTeamMembers as jest.MockedFunction<
  typeof getTeamMembers
>
const mockGetTeam = getTeam as jest.MockedFunction<typeof getTeam>

// Mock console.error to avoid noise in test output
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()

describe('team-auth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockConsoleError.mockClear()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  describe('verifyTeamAccess', () => {
    const mockTeamId = 'team-123'
    const mockUserId = 'user-123'
    const mockUserEmail = 'user@example.com'

    describe('when user is a member', () => {
      it('should return authorized=true when user is a member (no role requirement)', async () => {
        const mockMembers: TeamMember[] = [
          {
            id: mockUserId,
            email: mockUserEmail,
            role: 'member',
            joinedAt: new Date('2024-01-01'),
            invitedBy: 'owner-123',
          },
        ]

        mockGetTeamMembers.mockResolvedValue(mockMembers)

        const result = await verifyTeamAccess(mockTeamId, mockUserId)

        expect(result).toEqual({
          authorized: true,
          userRole: 'member',
        })
        expect(mockGetTeamMembers).toHaveBeenCalledWith(mockTeamId)
      })

      it('should match user by id', async () => {
        const mockMembers: TeamMember[] = [
          {
            id: mockUserId,
            email: 'different@example.com',
            role: 'member',
            joinedAt: new Date('2024-01-01'),
            invitedBy: 'owner-123',
          },
        ]

        mockGetTeamMembers.mockResolvedValue(mockMembers)

        const result = await verifyTeamAccess(mockTeamId, mockUserId)

        expect(result).toEqual({
          authorized: true,
          userRole: 'member',
        })
      })

      it('should match user by email', async () => {
        const mockMembers: TeamMember[] = [
          {
            id: 'different-id',
            email: mockUserEmail,
            role: 'admin',
            joinedAt: new Date('2024-01-01'),
            invitedBy: 'owner-123',
          },
        ]

        mockGetTeamMembers.mockResolvedValue(mockMembers)

        const result = await verifyTeamAccess(mockTeamId, mockUserEmail)

        expect(result).toEqual({
          authorized: true,
          userRole: 'admin',
        })
      })

      it('should return authorized=true when owner has required admin role', async () => {
        const mockMembers: TeamMember[] = [
          {
            id: mockUserId,
            email: mockUserEmail,
            role: 'owner',
            joinedAt: new Date('2024-01-01'),
            invitedBy: 'owner-123',
          },
        ]

        mockGetTeamMembers.mockResolvedValue(mockMembers)

        const result = await verifyTeamAccess(mockTeamId, mockUserId, 'admin')

        expect(result).toEqual({
          authorized: true,
          userRole: 'owner',
        })
      })

      it('should return authorized=true when admin has required admin role', async () => {
        const mockMembers: TeamMember[] = [
          {
            id: mockUserId,
            email: mockUserEmail,
            role: 'admin',
            joinedAt: new Date('2024-01-01'),
            invitedBy: 'owner-123',
          },
        ]

        mockGetTeamMembers.mockResolvedValue(mockMembers)

        const result = await verifyTeamAccess(mockTeamId, mockUserId, 'admin')

        expect(result).toEqual({
          authorized: true,
          userRole: 'admin',
        })
      })

      it('should return authorized=true when owner has required owner role', async () => {
        const mockMembers: TeamMember[] = [
          {
            id: mockUserId,
            email: mockUserEmail,
            role: 'owner',
            joinedAt: new Date('2024-01-01'),
            invitedBy: 'owner-123',
          },
        ]

        mockGetTeamMembers.mockResolvedValue(mockMembers)

        const result = await verifyTeamAccess(mockTeamId, mockUserId, 'owner')

        expect(result).toEqual({
          authorized: true,
          userRole: 'owner',
        })
      })

      it('should return authorized=false when member does not have required admin role', async () => {
        const mockMembers: TeamMember[] = [
          {
            id: mockUserId,
            email: mockUserEmail,
            role: 'member',
            joinedAt: new Date('2024-01-01'),
            invitedBy: 'owner-123',
          },
        ]

        mockGetTeamMembers.mockResolvedValue(mockMembers)

        const result = await verifyTeamAccess(mockTeamId, mockUserId, 'admin')

        expect(result).toEqual({
          authorized: false,
          userRole: 'member',
          error: 'Insufficient permissions. Required: admin, Current: member',
        })
      })

      it('should return authorized=false when admin does not have required owner role', async () => {
        const mockMembers: TeamMember[] = [
          {
            id: mockUserId,
            email: mockUserEmail,
            role: 'admin',
            joinedAt: new Date('2024-01-01'),
            invitedBy: 'owner-123',
          },
        ]

        mockGetTeamMembers.mockResolvedValue(mockMembers)

        const result = await verifyTeamAccess(mockTeamId, mockUserId, 'owner')

        expect(result).toEqual({
          authorized: false,
          userRole: 'admin',
          error: 'Insufficient permissions. Required: owner, Current: admin',
        })
      })
    })

    describe('when user is not a member', () => {
      it('should return authorized=false when user is not in team members', async () => {
        const mockMembers: TeamMember[] = [
          {
            id: 'other-user',
            email: 'other@example.com',
            role: 'member',
            joinedAt: new Date('2024-01-01'),
            invitedBy: 'owner-123',
          },
        ]

        mockGetTeamMembers.mockResolvedValue(mockMembers)

        const result = await verifyTeamAccess(mockTeamId, mockUserId)

        expect(result).toEqual({
          authorized: false,
          error: 'User is not a member of this team',
        })
        expect(mockGetTeamMembers).toHaveBeenCalledWith(mockTeamId)
      })

      it('should return authorized=false when team has no members', async () => {
        mockGetTeamMembers.mockResolvedValue([])

        const result = await verifyTeamAccess(mockTeamId, mockUserId)

        expect(result).toEqual({
          authorized: false,
          error: 'User is not a member of this team',
        })
      })
    })

    describe('error handling', () => {
      it('should return authorized=false when getTeamMembers throws an error', async () => {
        const error = new Error('Firestore error')
        mockGetTeamMembers.mockRejectedValue(error)

        const result = await verifyTeamAccess(mockTeamId, mockUserId)

        expect(result).toEqual({
          authorized: false,
          error: 'Failed to verify team access',
        })
        expect(mockConsoleError).toHaveBeenCalledWith(
          'Error verifying team access:',
          error,
        )
      })

      it('should handle network errors gracefully', async () => {
        const error = new Error('Network error')
        mockGetTeamMembers.mockRejectedValue(error)

        const result = await verifyTeamAccess(mockTeamId, mockUserId)

        expect(result).toEqual({
          authorized: false,
          error: 'Failed to verify team access',
        })
      })
    })
  })

  describe('verifyTeamOwnership', () => {
    const mockTeamId = 'team-123'
    const mockOwnerId = 'owner-123'
    const mockNonOwnerId = 'user-456'

    describe('when user is owner', () => {
      it('should return true when user is the team owner', async () => {
        const mockTeam: Team = {
          id: mockTeamId,
          name: 'Test Team',
          ownerId: mockOwnerId,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        }

        mockGetTeam.mockResolvedValue(mockTeam)

        const result = await verifyTeamOwnership(mockTeamId, mockOwnerId)

        expect(result).toBe(true)
        expect(mockGetTeam).toHaveBeenCalledWith(mockTeamId)
      })
    })

    describe('when user is not owner', () => {
      it('should return false when user is not the team owner', async () => {
        const mockTeam: Team = {
          id: mockTeamId,
          name: 'Test Team',
          ownerId: mockOwnerId,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        }

        mockGetTeam.mockResolvedValue(mockTeam)

        const result = await verifyTeamOwnership(mockTeamId, mockNonOwnerId)

        expect(result).toBe(false)
        expect(mockGetTeam).toHaveBeenCalledWith(mockTeamId)
      })

      it('should return false when team does not exist', async () => {
        mockGetTeam.mockResolvedValue(null)

        const result = await verifyTeamOwnership(mockTeamId, mockOwnerId)

        expect(result).toBe(false)
        expect(mockGetTeam).toHaveBeenCalledWith(mockTeamId)
      })
    })

    describe('error handling', () => {
      it('should return false when getTeam throws an error', async () => {
        const error = new Error('Firestore error')
        mockGetTeam.mockRejectedValue(error)

        const result = await verifyTeamOwnership(mockTeamId, mockOwnerId)

        expect(result).toBe(false)
        expect(mockConsoleError).toHaveBeenCalledWith(
          'Error verifying team ownership:',
          error,
        )
      })

      it('should handle network errors gracefully', async () => {
        const error = new Error('Network error')
        mockGetTeam.mockRejectedValue(error)

        const result = await verifyTeamOwnership(mockTeamId, mockOwnerId)

        expect(result).toBe(false)
      })
    })
  })
})
