import type { Subscription, Team } from '@/lib/types'
import { getUserSubscription } from '@/services/stripe/subscriptions'
import { getTeamSubscription, getUserTeam } from '@/services/team-service'

import { getSubscriptionForUser } from '../subscription-server'

// Mock the services
jest.mock('@/services/stripe/subscriptions')
jest.mock('@/services/team-service')

const mockGetUserSubscription = getUserSubscription as jest.MockedFunction<
  typeof getUserSubscription
>
const mockGetUserTeam = getUserTeam as jest.MockedFunction<typeof getUserTeam>
const mockGetTeamSubscription = getTeamSubscription as jest.MockedFunction<
  typeof getTeamSubscription
>

// Mock console.error to avoid noise in test output
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()

describe('subscription-server', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockConsoleError.mockClear()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  describe('getSubscriptionForUser', () => {
    const mockUserId = 'user-123'
    const mockTeamId = 'team-123'

    describe('when userId is empty', () => {
      it('should return no subscription when userId is empty string', async () => {
        const result = await getSubscriptionForUser('')

        expect(result).toEqual({
          hasValidSubscription: false,
          subscription: null,
        })
        expect(mockGetUserSubscription).not.toHaveBeenCalled()
        expect(mockGetUserTeam).not.toHaveBeenCalled()
      })
    })

    describe('individual subscription scenarios', () => {
      it('should return valid subscription when user has active individual subscription', async () => {
        const mockSubscription: Subscription = {
          stripeSubscriptionId: 'sub_123',
          stripeCustomerId: 'cus_123',
          status: 'active',
          currentPeriodStart: new Date('2024-01-01'),
          cancelAtPeriodEnd: false,
          priceId: 'price_123',
          quantity: 1,
          updatedAt: new Date('2024-01-01'),
          planName: 'Individual Plan',
          planDescription: 'Individual subscription',
        }

        mockGetUserSubscription.mockResolvedValue(mockSubscription)

        const result = await getSubscriptionForUser(mockUserId)

        expect(result).toEqual({
          hasValidSubscription: true,
          subscription: mockSubscription,
        })
        expect(mockGetUserSubscription).toHaveBeenCalledWith(mockUserId)
        expect(mockGetUserTeam).not.toHaveBeenCalled()
      })

      it('should return valid subscription when user has trialing individual subscription', async () => {
        const mockSubscription: Subscription = {
          stripeSubscriptionId: 'sub_123',
          stripeCustomerId: 'cus_123',
          status: 'trialing',
          currentPeriodStart: new Date('2024-01-01'),
          cancelAtPeriodEnd: false,
          priceId: 'price_123',
          quantity: 1,
          updatedAt: new Date('2024-01-01'),
          planName: 'Individual Plan',
          planDescription: 'Individual subscription',
          trialEnd: new Date('2024-01-15'),
        }

        mockGetUserSubscription.mockResolvedValue(mockSubscription)

        const result = await getSubscriptionForUser(mockUserId)

        expect(result).toEqual({
          hasValidSubscription: true,
          subscription: mockSubscription,
        })
        expect(mockGetUserSubscription).toHaveBeenCalledWith(mockUserId)
      })

      it('should return invalid subscription when user has canceled individual subscription', async () => {
        const mockSubscription: Subscription = {
          stripeSubscriptionId: 'sub_123',
          stripeCustomerId: 'cus_123',
          status: 'canceled',
          currentPeriodStart: new Date('2024-01-01'),
          cancelAtPeriodEnd: false,
          priceId: 'price_123',
          quantity: 1,
          updatedAt: new Date('2024-01-01'),
        }

        mockGetUserSubscription.mockResolvedValue(mockSubscription)

        const result = await getSubscriptionForUser(mockUserId)

        expect(result).toEqual({
          hasValidSubscription: false,
          subscription: mockSubscription,
        })
        expect(mockGetUserSubscription).toHaveBeenCalledWith(mockUserId)
      })

      it('should return invalid subscription when user has past_due individual subscription', async () => {
        const mockSubscription: Subscription = {
          stripeSubscriptionId: 'sub_123',
          stripeCustomerId: 'cus_123',
          status: 'past_due',
          currentPeriodStart: new Date('2024-01-01'),
          cancelAtPeriodEnd: false,
          priceId: 'price_123',
          quantity: 1,
          updatedAt: new Date('2024-01-01'),
        }

        mockGetUserSubscription.mockResolvedValue(mockSubscription)

        const result = await getSubscriptionForUser(mockUserId)

        expect(result).toEqual({
          hasValidSubscription: false,
          subscription: mockSubscription,
        })
      })
    })

    describe('team subscription fallback scenarios', () => {
      it('should return team subscription when no individual subscription but user has team with active subscription', async () => {
        const mockTeam: Team = {
          id: mockTeamId,
          name: 'Test Team',
          ownerId: 'owner-123',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        }

        const mockTeamSubscription: Subscription = {
          stripeSubscriptionId: 'sub_team_123',
          stripeCustomerId: 'cus_team_123',
          status: 'active',
          currentPeriodStart: new Date('2024-01-01'),
          cancelAtPeriodEnd: false,
          priceId: 'price_team_123',
          quantity: 5,
          updatedAt: new Date('2024-01-01'),
          planName: 'Team Plan',
          planDescription: 'Team subscription',
        }

        mockGetUserSubscription.mockResolvedValue(null)
        mockGetUserTeam.mockResolvedValue(mockTeam)
        mockGetTeamSubscription.mockResolvedValue(mockTeamSubscription)

        const result = await getSubscriptionForUser(mockUserId)

        expect(result).toEqual({
          hasValidSubscription: true,
          subscription: mockTeamSubscription,
        })
        expect(mockGetUserSubscription).toHaveBeenCalledWith(mockUserId)
        expect(mockGetUserTeam).toHaveBeenCalledWith(mockUserId)
        expect(mockGetTeamSubscription).toHaveBeenCalledWith(mockTeamId)
      })

      it('should return team subscription when no individual subscription but user has team with trialing subscription', async () => {
        const mockTeam: Team = {
          id: mockTeamId,
          name: 'Test Team',
          ownerId: 'owner-123',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        }

        const mockTeamSubscription: Subscription = {
          stripeSubscriptionId: 'sub_team_123',
          stripeCustomerId: 'cus_team_123',
          status: 'trialing',
          currentPeriodStart: new Date('2024-01-01'),
          cancelAtPeriodEnd: false,
          priceId: 'price_team_123',
          quantity: 5,
          updatedAt: new Date('2024-01-01'),
          planName: 'Team Plan',
          planDescription: 'Team subscription',
          trialEnd: new Date('2024-01-15'),
        }

        mockGetUserSubscription.mockResolvedValue(null)
        mockGetUserTeam.mockResolvedValue(mockTeam)
        mockGetTeamSubscription.mockResolvedValue(mockTeamSubscription)

        const result = await getSubscriptionForUser(mockUserId)

        expect(result).toEqual({
          hasValidSubscription: true,
          subscription: mockTeamSubscription,
        })
        expect(mockGetUserTeam).toHaveBeenCalledWith(mockUserId)
        expect(mockGetTeamSubscription).toHaveBeenCalledWith(mockTeamId)
      })

      it('should return invalid team subscription when no individual subscription but user has team with canceled subscription', async () => {
        const mockTeam: Team = {
          id: mockTeamId,
          name: 'Test Team',
          ownerId: 'owner-123',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        }

        const mockTeamSubscription: Subscription = {
          stripeSubscriptionId: 'sub_team_123',
          stripeCustomerId: 'cus_team_123',
          status: 'canceled',
          currentPeriodStart: new Date('2024-01-01'),
          cancelAtPeriodEnd: false,
          priceId: 'price_team_123',
          quantity: 5,
          updatedAt: new Date('2024-01-01'),
        }

        mockGetUserSubscription.mockResolvedValue(null)
        mockGetUserTeam.mockResolvedValue(mockTeam)
        mockGetTeamSubscription.mockResolvedValue(mockTeamSubscription)

        const result = await getSubscriptionForUser(mockUserId)

        expect(result).toEqual({
          hasValidSubscription: false,
          subscription: mockTeamSubscription,
        })
      })

      it('should return no subscription when no individual subscription and user has no team', async () => {
        mockGetUserSubscription.mockResolvedValue(null)
        mockGetUserTeam.mockResolvedValue(null)

        const result = await getSubscriptionForUser(mockUserId)

        expect(result).toEqual({
          hasValidSubscription: false,
          subscription: null,
        })
        expect(mockGetUserSubscription).toHaveBeenCalledWith(mockUserId)
        expect(mockGetUserTeam).toHaveBeenCalledWith(mockUserId)
        expect(mockGetTeamSubscription).not.toHaveBeenCalled()
      })

      it('should return no subscription when no individual subscription, user has team but no team subscription', async () => {
        const mockTeam: Team = {
          id: mockTeamId,
          name: 'Test Team',
          ownerId: 'owner-123',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        }

        mockGetUserSubscription.mockResolvedValue(null)
        mockGetUserTeam.mockResolvedValue(mockTeam)
        mockGetTeamSubscription.mockResolvedValue(null)

        const result = await getSubscriptionForUser(mockUserId)

        expect(result).toEqual({
          hasValidSubscription: false,
          subscription: null,
        })
        expect(mockGetUserTeam).toHaveBeenCalledWith(mockUserId)
        expect(mockGetTeamSubscription).toHaveBeenCalledWith(mockTeamId)
      })
    })

    describe('error handling', () => {
      it('should return no subscription when getUserSubscription throws an error', async () => {
        const error = new Error('Stripe API error')
        mockGetUserSubscription.mockRejectedValue(error)

        const result = await getSubscriptionForUser(mockUserId)

        expect(result).toEqual({
          hasValidSubscription: false,
          subscription: null,
        })
        expect(mockConsoleError).toHaveBeenCalledWith(
          'Error fetching subscription:',
          error,
        )
      })

      it('should return no subscription when getUserTeam throws an error', async () => {
        const error = new Error('Team service error')
        mockGetUserSubscription.mockResolvedValue(null)
        mockGetUserTeam.mockRejectedValue(error)

        const result = await getSubscriptionForUser(mockUserId)

        expect(result).toEqual({
          hasValidSubscription: false,
          subscription: null,
        })
        expect(mockConsoleError).toHaveBeenCalledWith(
          'Error fetching subscription:',
          error,
        )
      })

      it('should return no subscription when getTeamSubscription throws an error', async () => {
        const error = new Error('Team subscription error')
        const mockTeam: Team = {
          id: mockTeamId,
          name: 'Test Team',
          ownerId: 'owner-123',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        }

        mockGetUserSubscription.mockResolvedValue(null)
        mockGetUserTeam.mockResolvedValue(mockTeam)
        mockGetTeamSubscription.mockRejectedValue(error)

        const result = await getSubscriptionForUser(mockUserId)

        expect(result).toEqual({
          hasValidSubscription: false,
          subscription: null,
        })
        expect(mockConsoleError).toHaveBeenCalledWith(
          'Error fetching subscription:',
          error,
        )
      })

      it('should handle network errors gracefully', async () => {
        const error = new Error('Network error')
        mockGetUserSubscription.mockRejectedValue(error)

        const result = await getSubscriptionForUser(mockUserId)

        expect(result).toEqual({
          hasValidSubscription: false,
          subscription: null,
        })
      })
    })
  })
})
