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
      it.each([
        ['active', true],
        ['trialing', true],
        ['canceled', false],
        ['past_due', false],
      ])(
        'should return subscription with valid=%s when user has %s individual subscription',
        async (status, isValid) => {
          const mockSubscription: Subscription = {
            stripeSubscriptionId: 'sub_123',
            stripeCustomerId: 'cus_123',
            status: status as Subscription['status'],
            currentPeriodStart: new Date('2024-01-01'),
            cancelAtPeriodEnd: false,
            priceId: 'price_123',
            quantity: 1,
            updatedAt: new Date('2024-01-01'),
            planName: 'Individual Plan',
            planDescription: 'Individual subscription',
            ...(status === 'trialing' && {
              trialEnd: new Date('2024-01-15'),
            }),
          }

          mockGetUserSubscription.mockResolvedValue(mockSubscription)

          const result = await getSubscriptionForUser(mockUserId)

          expect(result).toEqual({
            hasValidSubscription: isValid,
            subscription: mockSubscription,
          })
          expect(mockGetUserSubscription).toHaveBeenCalledWith(mockUserId)
          if (status === 'active') {
            expect(mockGetUserTeam).not.toHaveBeenCalled()
          }
        },
      )
    })

    describe('team subscription fallback scenarios', () => {
      const mockTeam: Team = {
        id: mockTeamId,
        name: 'Test Team',
        ownerId: 'owner-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      it.each([
        ['active', true],
        ['trialing', true],
        ['canceled', false],
      ])(
        'should return team subscription with valid=%s when no individual subscription but user has team with %s subscription',
        async (status, isValid) => {
          const mockTeamSubscription: Subscription = {
            stripeSubscriptionId: 'sub_team_123',
            stripeCustomerId: 'cus_team_123',
            status: status as Subscription['status'],
            currentPeriodStart: new Date('2024-01-01'),
            cancelAtPeriodEnd: false,
            priceId: 'price_team_123',
            quantity: 5,
            updatedAt: new Date('2024-01-01'),
            planName: 'Team Plan',
            planDescription: 'Team subscription',
            ...(status === 'trialing' && {
              trialEnd: new Date('2024-01-15'),
            }),
          }

          mockGetUserSubscription.mockResolvedValue(undefined)
          mockGetUserTeam.mockResolvedValue(mockTeam)
          mockGetTeamSubscription.mockResolvedValue(mockTeamSubscription)

          const result = await getSubscriptionForUser(mockUserId)

          expect(result).toEqual({
            hasValidSubscription: isValid,
            subscription: mockTeamSubscription,
          })
          expect(mockGetUserSubscription).toHaveBeenCalledWith(mockUserId)
          expect(mockGetUserTeam).toHaveBeenCalledWith(mockUserId)
          expect(mockGetTeamSubscription).toHaveBeenCalledWith(mockTeamId)
        },
      )

      it('should return no subscription when no individual subscription and user has no team or no team subscription', async () => {
        const testCases = [
          {
            name: 'user has no team',
            team: null,
            teamSubscription: null,
            expectTeamSubscriptionCall: false,
          },
          {
            name: 'user has team but no team subscription',
            team: mockTeam,
            teamSubscription: null,
            expectTeamSubscriptionCall: true,
          },
        ]

        for (const testCase of testCases) {
          mockGetUserSubscription.mockResolvedValue(undefined)
          mockGetUserTeam.mockResolvedValue(testCase.team)
          if (testCase.expectTeamSubscriptionCall) {
            mockGetTeamSubscription.mockResolvedValue(testCase.teamSubscription)
          }

          const result = await getSubscriptionForUser(mockUserId)

          expect(result).toEqual({
            hasValidSubscription: false,
            subscription: null,
          })
          expect(mockGetUserSubscription).toHaveBeenCalledWith(mockUserId)
          expect(mockGetUserTeam).toHaveBeenCalledWith(mockUserId)
          if (testCase.expectTeamSubscriptionCall) {
            expect(mockGetTeamSubscription).toHaveBeenCalledWith(mockTeamId)
          } else {
            expect(mockGetTeamSubscription).not.toHaveBeenCalled()
          }

          jest.clearAllMocks()
        }
      })
    })

    describe('error handling', () => {
      it.each([
        {
          name: 'getUserSubscription throws an error',
          setup: () => {
            mockGetUserSubscription.mockRejectedValue(
              new Error('Stripe API error'),
            )
          },
        },
        {
          name: 'getUserTeam throws an error',
          setup: () => {
            mockGetUserSubscription.mockResolvedValue(undefined)
            mockGetUserTeam.mockRejectedValue(new Error('Team service error'))
          },
        },
        {
          name: 'getTeamSubscription throws an error',
          setup: () => {
            const mockTeam: Team = {
              id: mockTeamId,
              name: 'Test Team',
              ownerId: 'owner-123',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            }
            mockGetUserSubscription.mockResolvedValue(undefined)
            mockGetUserTeam.mockResolvedValue(mockTeam)
            mockGetTeamSubscription.mockRejectedValue(
              new Error('Team subscription error'),
            )
          },
        },
        {
          name: 'network error occurs',
          setup: () => {
            mockGetUserSubscription.mockRejectedValue(
              new Error('Network error'),
            )
          },
        },
      ])('should return no subscription when $name', async ({ setup }) => {
        setup()

        const result = await getSubscriptionForUser(mockUserId)

        expect(result).toEqual({
          hasValidSubscription: false,
          subscription: null,
        })
        expect(mockConsoleError).toHaveBeenCalled()
      })
    })
  })
})
