import React from 'react'

import { act, renderHook, waitFor } from '@jest-setup'

import type { Subscription } from '@/lib/types'
import { subscriptionService } from '@/services/subscription-service'
import { createMockAuthContext, createMockUser } from '@/test-utils/auth-mocks'

import {
  SubscriptionProvider,
  useSubscriptionContext,
} from '../subscription-context'

// Mock subscription service
jest.mock('@/services/subscription-service', () => ({
  subscriptionService: {
    getUserSubscription: jest.fn(),
    clearCache: jest.fn(),
  },
}))

const mockGetUserSubscription =
  subscriptionService.getUserSubscription as jest.MockedFunction<
    typeof subscriptionService.getUserSubscription
  >
const mockClearCache = subscriptionService.clearCache as jest.MockedFunction<
  typeof subscriptionService.clearCache
>

// Mock useAuth
const mockAuthContext = createMockAuthContext()
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SubscriptionProvider>{children}</SubscriptionProvider>
)

describe('SubscriptionContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthContext.user = null
    mockAuthContext.loading = false
    mockClearCache.mockReturnValue(undefined)
  })

  describe('useSubscriptionContext hook', () => {
    it('returns default values when used without provider', () => {
      // Note: Since the context has a default value, useContext won't throw
      // but will return the default. The actual check for undefined in the hook
      // won't trigger because createContext provides a default value.
      // This test verifies the hook works without throwing.
      const { result } = renderHook(() => useSubscriptionContext())

      expect(result.current.hasValidSubscription).toBe(null)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.subscription).toBe(null)
      expect(typeof result.current.invalidateSubscription).toBe('function')
    })
  })

  describe('SubscriptionProvider - No User', () => {
    it('sets hasValidSubscription to false when no user', async () => {
      mockAuthContext.user = null

      const { result } = renderHook(() => useSubscriptionContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.hasValidSubscription).toBe(false)
        expect(result.current.loading).toBe(false)
        expect(result.current.subscription).toBe(null)
        expect(result.current.error).toBe(null)
      })
    })

    it('does not fetch subscription when user is null', async () => {
      mockAuthContext.user = null

      renderHook(() => useSubscriptionContext(), { wrapper })

      await waitFor(() => {
        expect(mockGetUserSubscription).not.toHaveBeenCalled()
      })
    })
  })

  describe('SubscriptionProvider - With User', () => {
    beforeEach(() => {
      mockAuthContext.user = createMockUser({
        uid: 'user123',
        email: 'test@example.com',
      })
    })

    it('fetches subscription when user is present', async () => {
      const mockSubscription: Subscription = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active',
        currentPeriodStart: new Date(),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        updatedAt: new Date(),
      }

      mockGetUserSubscription.mockResolvedValue({
        subscription: mockSubscription,
        ownerId: 'user123',
      })

      const { result } = renderHook(() => useSubscriptionContext(), {
        wrapper,
      })

      expect(result.current.loading).toBe(true)
      expect(mockGetUserSubscription).toHaveBeenCalledWith('user123')

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.subscription).toEqual(mockSubscription)
        expect(result.current.hasValidSubscription).toBe(true)
        expect(result.current.error).toBe(null)
      })
    })

    it('sets hasValidSubscription to false when subscription is null', async () => {
      mockGetUserSubscription.mockResolvedValue({
        subscription: null,
        ownerId: 'user123',
      })

      const { result } = renderHook(() => useSubscriptionContext(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.subscription).toBe(null)
        expect(result.current.hasValidSubscription).toBe(false)
        expect(result.current.error).toBe(null)
      })
    })

    it('sets hasValidSubscription to true for active subscription', async () => {
      const mockSubscription: Subscription = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active',
        currentPeriodStart: new Date(),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        updatedAt: new Date(),
      }

      mockGetUserSubscription.mockResolvedValue({
        subscription: mockSubscription,
        ownerId: 'user123',
      })

      const { result } = renderHook(() => useSubscriptionContext(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.hasValidSubscription).toBe(true)
      })
    })

    it('sets hasValidSubscription to true for trialing subscription', async () => {
      const mockSubscription: Subscription = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'trialing',
        currentPeriodStart: new Date(),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        updatedAt: new Date(),
      }

      mockGetUserSubscription.mockResolvedValue({
        subscription: mockSubscription,
        ownerId: 'user123',
      })

      const { result } = renderHook(() => useSubscriptionContext(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.hasValidSubscription).toBe(true)
      })
    })

    it('sets hasValidSubscription to false for canceled subscription', async () => {
      const mockSubscription: Subscription = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'canceled',
        currentPeriodStart: new Date(),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        updatedAt: new Date(),
      }

      mockGetUserSubscription.mockResolvedValue({
        subscription: mockSubscription,
        ownerId: 'user123',
      })

      const { result } = renderHook(() => useSubscriptionContext(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.hasValidSubscription).toBe(false)
        expect(result.current.subscription).toEqual(mockSubscription)
      })
    })

    it('handles errors during fetch', async () => {
      const error = new Error('Failed to fetch subscription')
      mockGetUserSubscription.mockRejectedValue(error)

      const { result } = renderHook(() => useSubscriptionContext(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toEqual(error)
        expect(result.current.hasValidSubscription).toBe(false)
        expect(result.current.subscription).toBe(null)
      })
    })

    it('deduplicates concurrent requests', async () => {
      const mockSubscription: Subscription = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active',
        currentPeriodStart: new Date(),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        updatedAt: new Date(),
      }

      mockGetUserSubscription.mockResolvedValue({
        subscription: mockSubscription,
        ownerId: 'user123',
      })

      const { result } = renderHook(() => useSubscriptionContext(), {
        wrapper,
      })

      // Trigger multiple renders quickly (simulating concurrent access)
      act(() => {
        // Change user to trigger refetch
        mockAuthContext.user = createMockUser({
          uid: 'user123',
          email: 'test@example.com',
        })
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should only be called once despite multiple renders
      expect(mockGetUserSubscription).toHaveBeenCalledTimes(1)
    })

    it('does not refetch when user has not changed and data exists', async () => {
      const mockSubscription: Subscription = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active',
        currentPeriodStart: new Date(),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        updatedAt: new Date(),
      }

      mockGetUserSubscription.mockResolvedValue({
        subscription: mockSubscription,
        ownerId: 'user123',
      })

      const { result } = renderHook(() => useSubscriptionContext(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.subscription).toEqual(mockSubscription)
      })

      const callCount = mockGetUserSubscription.mock.calls.length

      // Trigger re-render by changing something unrelated
      act(() => {
        // Simulate a re-render
        mockAuthContext.user = createMockUser({
          uid: 'user123',
          email: 'test@example.com',
        })
      })

      await waitFor(() => {
        // Should not have called again
        expect(mockGetUserSubscription.mock.calls.length).toBe(callCount)
      })
    })

    it('refetches when user changes', async () => {
      // Start with first user
      mockAuthContext.user = createMockUser({
        uid: 'user123',
        email: 'test@example.com',
      })

      const mockSubscription1: Subscription = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active',
        currentPeriodStart: new Date(),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        updatedAt: new Date(),
      }

      const mockSubscription2: Subscription = {
        stripeSubscriptionId: 'sub_456',
        stripeCustomerId: 'cus_456',
        status: 'active',
        currentPeriodStart: new Date(),
        cancelAtPeriodEnd: false,
        priceId: 'price_456',
        updatedAt: new Date(),
      }

      mockGetUserSubscription
        .mockResolvedValueOnce({
          subscription: mockSubscription1,
          ownerId: 'user123',
        })
        .mockResolvedValueOnce({
          subscription: mockSubscription2,
          ownerId: 'user456',
        })

      const { result, rerender } = renderHook(() => useSubscriptionContext(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.subscription?.stripeSubscriptionId).toBe(
          'sub_123',
        )
        expect(mockGetUserSubscription).toHaveBeenCalledWith('user123')
      })

      // Change user to a different UID - create new user object to ensure React detects change
      const newUser = createMockUser({
        uid: 'user456',
        email: 'test2@example.com',
      })

      act(() => {
        mockAuthContext.user = newUser
      })

      // Force rerender to trigger useEffect
      rerender()

      // Wait for the effect to run and fetch new subscription
      await waitFor(
        () => {
          expect(mockGetUserSubscription).toHaveBeenCalledWith('user456')
          expect(result.current.subscription?.stripeSubscriptionId).toBe(
            'sub_456',
          )
        },
        { timeout: 3000 },
      )
    })
  })

  describe('invalidateSubscription', () => {
    beforeEach(() => {
      mockAuthContext.user = createMockUser({
        uid: 'user123',
        email: 'test@example.com',
      })
    })

    it('clears cache and refetches subscription', async () => {
      const mockSubscription: Subscription = {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active',
        currentPeriodStart: new Date('2024-01-01'),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        updatedAt: new Date(),
      }

      // Mock to return the same subscription on both calls
      mockGetUserSubscription.mockResolvedValue({
        subscription: mockSubscription,
        ownerId: 'user123',
      })

      const { result } = renderHook(() => useSubscriptionContext(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.subscription?.stripeSubscriptionId).toBe(
          'sub_123',
        )
      })

      const initialCallCount = mockGetUserSubscription.mock.calls.length
      expect(initialCallCount).toBeGreaterThan(0)

      // Invalidate
      act(() => {
        result.current.invalidateSubscription()
      })

      expect(mockClearCache).toHaveBeenCalled()

      // Wait for refetch to complete
      await waitFor(() => {
        // Should have been called at least one more time
        expect(mockGetUserSubscription.mock.calls.length).toBeGreaterThan(
          initialCallCount,
        )
        // Subscription should still be valid after refetch
        expect(result.current.subscription?.stripeSubscriptionId).toBe(
          'sub_123',
        )
      })
    })

    it('does nothing when no user', () => {
      mockAuthContext.user = null

      const { result } = renderHook(() => useSubscriptionContext(), {
        wrapper,
      })

      act(() => {
        result.current.invalidateSubscription()
      })

      expect(mockClearCache).not.toHaveBeenCalled()
      expect(mockGetUserSubscription).not.toHaveBeenCalled()
    })
  })
})
