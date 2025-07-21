import type { Subscription } from '@/lib/types'

import { subscriptionService } from '../subscription-service'

// Mock fetch
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('SubscriptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    subscriptionService.clearCache()
  })

  describe('getUserSubscription', () => {
    it('returns cached subscription if available and not expired', async () => {
      const mockSubscription: Subscription = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active',
        currentPeriodStart: new Date('2024-01-01'),
        cancelAt: new Date('2024-12-31'),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        updatedAt: new Date(),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscription,
      } as Response)

      // First call to populate cache
      const result1 = await subscriptionService.getUserSubscription('user123')
      expect(result1).toEqual(mockSubscription)

      // Second call should use cache
      const result2 = await subscriptionService.getUserSubscription('user123')
      expect(result2).toEqual(mockSubscription)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('returns null when API returns non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response)

      const result = await subscriptionService.getUserSubscription('user123')
      expect(result).toBeNull()
    })

    it('returns null when API call fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await subscriptionService.getUserSubscription('user123')
      expect(result).toBeNull()
    })

    it('calls API with correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      } as Response)

      await subscriptionService.getUserSubscription('user123')

      expect(mockFetch).toHaveBeenCalledWith('/api/subscriptions/user123')
    })
  })

  describe('hasActiveSubscription', () => {
    it('returns true for active subscription', async () => {
      const mockSubscription: Subscription = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active',
        currentPeriodStart: new Date('2024-01-01'),
        cancelAt: new Date('2024-12-31'),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        updatedAt: new Date(),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscription,
      } as Response)

      const result = await subscriptionService.hasActiveSubscription('user123')
      expect(result).toBe(true)
    })

    it('returns false for non-active subscription', async () => {
      const mockSubscription: Subscription = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'canceled',
        currentPeriodStart: new Date('2024-01-01'),
        cancelAt: new Date('2024-12-31'),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        updatedAt: new Date(),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscription,
      } as Response)

      const result = await subscriptionService.hasActiveSubscription('user123')
      expect(result).toBe(false)
    })

    it('returns false for null subscription', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      } as Response)

      const result = await subscriptionService.hasActiveSubscription('user123')
      expect(result).toBe(false)
    })
  })

  describe('clearCache', () => {
    it('clears cached subscription', async () => {
      const mockSubscription: Subscription = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active',
        currentPeriodStart: new Date('2024-01-01'),
        cancelAt: new Date('2024-12-31'),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        updatedAt: new Date(),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscription,
      } as Response)

      // First call to populate cache
      await subscriptionService.getUserSubscription('user123')

      // Clear cache
      subscriptionService.clearCache()

      // Second call should hit API again
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscription,
      } as Response)

      await subscriptionService.getUserSubscription('user123')

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('helper methods', () => {
    const mockSubscription: Subscription = {
      stripeSubscriptionId: 'sub_123',
      stripeCustomerId: 'cus_123',
      status: 'active',
      currentPeriodStart: new Date('2024-01-01'),
      cancelAt: new Date('2024-12-31'),
      cancelAtPeriodEnd: false,
      priceId: 'price_123',
      updatedAt: new Date(),
    }

    it('isInTrial returns true for trialing subscription', () => {
      const trialingSubscription = {
        ...mockSubscription,
        status: 'trialing' as const,
      }
      expect(subscriptionService.isInTrial(trialingSubscription)).toBe(true)
    })

    it('isInTrial returns false for non-trialing subscription', () => {
      expect(subscriptionService.isInTrial(mockSubscription)).toBe(false)
    })

    it('isPastDue returns true for past_due subscription', () => {
      const pastDueSubscription = {
        ...mockSubscription,
        status: 'past_due' as const,
      }
      expect(subscriptionService.isPastDue(pastDueSubscription)).toBe(true)
    })

    it('isPastDue returns false for non-past_due subscription', () => {
      expect(subscriptionService.isPastDue(mockSubscription)).toBe(false)
    })

    it('isCanceled returns true for canceled subscription', () => {
      const canceledSubscription = {
        ...mockSubscription,
        status: 'canceled' as const,
      }
      expect(subscriptionService.isCanceled(canceledSubscription)).toBe(true)
    })

    it('isCanceled returns false for non-canceled subscription', () => {
      expect(subscriptionService.isCanceled(mockSubscription)).toBe(false)
    })
  })
})
