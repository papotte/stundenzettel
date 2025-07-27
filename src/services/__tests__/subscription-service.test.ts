import { subscriptionService } from '@/services/subscription-service'
import { getTeamSubscription, getUserTeam } from '@/services/team-service'

// Mock the team service
jest.mock('@/services/team-service')
const mockGetUserTeam = getUserTeam as jest.MockedFunction<typeof getUserTeam>
const mockGetTeamSubscription = getTeamSubscription as jest.MockedFunction<
  typeof getTeamSubscription
>

// Mock fetch
global.fetch = jest.fn()

describe('SubscriptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    subscriptionService.clearCache()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('getUserSubscription', () => {
    it('should return individual subscription when user has one', async () => {
      const mockSubscription = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active' as const,
        currentPeriodStart: new Date('2024-01-01'),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        quantity: 1,
        updatedAt: new Date('2024-01-01'),
        planName: 'Individual Plan',
        planDescription: 'Individual subscription',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscription,
      })

      const result = await subscriptionService.getUserSubscription('user123')

      expect(result).toEqual(mockSubscription)
      expect(global.fetch).toHaveBeenCalledWith('/api/subscriptions/user123')
      expect(mockGetUserTeam).not.toHaveBeenCalled()
    })

    it('should return team subscription when user has no individual subscription but is team member', async () => {
      const mockTeam = {
        id: 'team123',
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'owner123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const mockTeamSubscription = {
        stripeSubscriptionId: 'sub_team_123',
        stripeCustomerId: 'cus_team_123',
        status: 'active' as const,
        currentPeriodStart: new Date('2024-01-01'),
        cancelAtPeriodEnd: false,
        priceId: 'price_team_123',
        quantity: 5,
        updatedAt: new Date('2024-01-01'),
        planName: 'Team Plan',
        planDescription: 'Team subscription',
      }

      // Mock no individual subscription
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      // Mock team membership
      mockGetUserTeam.mockResolvedValueOnce(mockTeam)
      mockGetTeamSubscription.mockResolvedValueOnce(mockTeamSubscription)

      const result = await subscriptionService.getUserSubscription('user123')

      expect(result).toEqual(mockTeamSubscription)
      expect(global.fetch).toHaveBeenCalledWith('/api/subscriptions/user123')
      expect(mockGetUserTeam).toHaveBeenCalledWith('user123')
      expect(mockGetTeamSubscription).toHaveBeenCalledWith('team123')
    })

    it('should return null when user has no individual or team subscription', async () => {
      // Mock no individual subscription
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      // Mock no team membership
      mockGetUserTeam.mockResolvedValueOnce(null)

      const result = await subscriptionService.getUserSubscription('user123')

      expect(result).toBeNull()
      expect(global.fetch).toHaveBeenCalledWith('/api/subscriptions/user123')
      expect(mockGetUserTeam).toHaveBeenCalledWith('user123')
      expect(mockGetTeamSubscription).not.toHaveBeenCalled()
    })

    it('should return null when user is team member but team has no subscription', async () => {
      const mockTeam = {
        id: 'team123',
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'owner123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      // Mock no individual subscription
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      // Mock team membership but no subscription
      mockGetUserTeam.mockResolvedValueOnce(mockTeam)
      mockGetTeamSubscription.mockResolvedValueOnce(null)

      const result = await subscriptionService.getUserSubscription('user123')

      expect(result).toBeNull()
      expect(global.fetch).toHaveBeenCalledWith('/api/subscriptions/user123')
      expect(mockGetUserTeam).toHaveBeenCalledWith('user123')
      expect(mockGetTeamSubscription).toHaveBeenCalledWith('team123')
    })

    it('should handle API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

      const result = await subscriptionService.getUserSubscription('user123')

      expect(result).toBeNull()
      expect(global.fetch).toHaveBeenCalledWith('/api/subscriptions/user123')
      expect(mockGetUserTeam).not.toHaveBeenCalled()
    })

    it('should cache results and return cached data for subsequent calls', async () => {
      const mockSubscription = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active' as const,
        currentPeriodStart: new Date('2024-01-01'),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        quantity: 1,
        updatedAt: new Date('2024-01-01'),
        planName: 'Individual Plan',
        planDescription: 'Individual subscription',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscription,
      })

      // First call
      const result1 = await subscriptionService.getUserSubscription('user123')
      expect(result1).toEqual(mockSubscription)
      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Second call should use cache
      const result2 = await subscriptionService.getUserSubscription('user123')
      expect(result2).toEqual(mockSubscription)
      expect(global.fetch).toHaveBeenCalledTimes(1) // Still only called once
    })
  })

  describe('hasActiveSubscription', () => {
    it('should return true for active subscription', async () => {
      const mockSubscription = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active' as const,
        currentPeriodStart: new Date('2024-01-01'),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        quantity: 1,
        updatedAt: new Date('2024-01-01'),
        planName: 'Individual Plan',
        planDescription: 'Individual subscription',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscription,
      })

      const result =
        await subscriptionService.hasActiveSubscription('user@example.com')
      expect(result).toBe(true)
    })

    it('should return false for trialing subscription', async () => {
      const mockSubscription = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'trialing' as const,
        currentPeriodStart: new Date('2024-01-01'),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        quantity: 1,
        updatedAt: new Date('2024-01-01'),
        planName: 'Individual Plan',
        planDescription: 'Individual subscription',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscription,
      })

      const result =
        await subscriptionService.hasActiveSubscription('user@example.com')
      expect(result).toBe(false)
    })

    it('should return false for no subscription', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })
      mockGetUserTeam.mockResolvedValueOnce(null)

      const result =
        await subscriptionService.hasActiveSubscription('user@example.com')
      expect(result).toBe(false)
    })
  })

  describe('trial helpers', () => {
    const mockTrialSubscription = {
      stripeSubscriptionId: 'sub_123',
      stripeCustomerId: 'cus_123',
      status: 'trialing' as const,
      currentPeriodStart: new Date('2024-01-01'),
      cancelAtPeriodEnd: false,
      priceId: 'price_123',
      quantity: 1,
      updatedAt: new Date('2024-01-01'),
      planName: 'Individual Plan',
      planDescription: 'Individual subscription',
      trialEnd: new Date('2024-01-15'),
    }

    it('should correctly identify trial subscriptions', () => {
      expect(subscriptionService.isInTrial(mockTrialSubscription)).toBe(true)
      expect(subscriptionService.isInTrial(null)).toBe(false)
    })

    it('should correctly identify past due subscriptions', () => {
      const pastDueSubscription = {
        ...mockTrialSubscription,
        status: 'past_due' as const,
      }
      expect(subscriptionService.isPastDue(pastDueSubscription)).toBe(true)
      expect(subscriptionService.isPastDue(mockTrialSubscription)).toBe(false)
    })

    it('should correctly identify canceled subscriptions', () => {
      const canceledSubscription = {
        ...mockTrialSubscription,
        status: 'canceled' as const,
      }
      expect(subscriptionService.isCanceled(canceledSubscription)).toBe(true)
      expect(subscriptionService.isCanceled(mockTrialSubscription)).toBe(false)
    })

    it('should return trial end date', () => {
      expect(
        subscriptionService.getTrialEndDate(mockTrialSubscription),
      ).toEqual(new Date('2024-01-15'))
      expect(subscriptionService.getTrialEndDate(null)).toBeUndefined()
    })

    it('should check if trial is expiring soon', () => {
      // Mock current date to be 2024-01-12 (3 days before trial ends)
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-12'))

      expect(
        subscriptionService.isTrialExpiringSoon(mockTrialSubscription, 3),
      ).toBe(true)
      expect(
        subscriptionService.isTrialExpiringSoon(mockTrialSubscription, 1),
      ).toBe(false)

      jest.useRealTimers()
    })

    it('should calculate days remaining in trial', () => {
      // Mock current date to be 2024-01-12 (3 days before trial ends)
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-12'))

      expect(
        subscriptionService.getDaysRemainingInTrial(mockTrialSubscription),
      ).toBe(3)

      jest.useRealTimers()
    })
  })
})
