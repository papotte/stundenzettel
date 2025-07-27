import { renderHook, waitFor } from '@testing-library/react'

import { subscriptionService } from '@/services/subscription-service'

import {
  __clearSubscriptionCacheForTests,
  useSubscriptionStatus,
} from '../use-subscription-status'

// Mock the subscription service
jest.mock('@/services/subscription-service', () => ({
  subscriptionService: {
    getUserSubscription: jest.fn(),
    clearCache: jest.fn(),
  },
}))

describe('useSubscriptionStatus', () => {
  const testUser = { uid: 'user123' }
  const validSub = { status: 'active' }
  const trialSub = { status: 'trialing' }
  const invalidSub = { status: 'canceled' }
  const teamSub = { status: 'active', planName: 'Team Plan' }

  beforeEach(() => {
    jest.clearAllMocks()
    __clearSubscriptionCacheForTests()
  })

  it('returns false and not loading if user is undefined', () => {
    const { result } = renderHook(() => useSubscriptionStatus(undefined))
    expect(result.current.hasValidSubscription).toBe(false)
    expect(result.current.loading).toBe(false)
    expect(result.current.subscription).toBe(null)
    expect(result.current.error).toBe(null)
  })

  it('returns false and not loading if user is null', () => {
    const { result } = renderHook(() => useSubscriptionStatus(null))
    expect(result.current.hasValidSubscription).toBe(false)
    expect(result.current.loading).toBe(false)
    expect(result.current.subscription).toBe(null)
    expect(result.current.error).toBe(null)
  })

  it('calls getUserSubscription and returns true for active subscription', async () => {
    ;(
      subscriptionService.getUserSubscription as jest.Mock
    ).mockResolvedValueOnce(validSub)
    const { result } = renderHook(() => useSubscriptionStatus(testUser))
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasValidSubscription).toBe(true)
    expect(result.current.subscription).toEqual(validSub)
    expect(subscriptionService.getUserSubscription).toHaveBeenCalledWith(
      'user123',
    )
  })

  it('returns true for trialing subscription', async () => {
    ;(
      subscriptionService.getUserSubscription as jest.Mock
    ).mockResolvedValueOnce(trialSub)
    const { result } = renderHook(() => useSubscriptionStatus(testUser))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasValidSubscription).toBe(true)
    expect(result.current.subscription).toEqual(trialSub)
  })

  it('returns false for invalid subscription', async () => {
    ;(
      subscriptionService.getUserSubscription as jest.Mock
    ).mockResolvedValueOnce(invalidSub)
    const { result } = renderHook(() => useSubscriptionStatus(testUser))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasValidSubscription).toBe(false)
    expect(result.current.subscription).toEqual(invalidSub)
  })

  it('returns true for team subscription when user has no individual subscription', async () => {
    ;(
      subscriptionService.getUserSubscription as jest.Mock
    ).mockResolvedValueOnce(teamSub)
    const { result } = renderHook(() => useSubscriptionStatus(testUser))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasValidSubscription).toBe(true)
    expect(result.current.subscription).toEqual(teamSub)
    expect(result.current.subscription?.planName).toBe('Team Plan')
  })

  it('returns cached value for the same user and does not call API again', async () => {
    ;(
      subscriptionService.getUserSubscription as jest.Mock
    ).mockResolvedValueOnce(validSub)
    const { result, rerender } = renderHook(
      ({ user }) => useSubscriptionStatus(user),
      { initialProps: { user: testUser } },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasValidSubscription).toBe(true)
    expect(subscriptionService.getUserSubscription).toHaveBeenCalledTimes(1)
    // Rerender with same user
    rerender({ user: testUser })
    expect(result.current.hasValidSubscription).toBe(true)
    expect(subscriptionService.getUserSubscription).toHaveBeenCalledTimes(1)
  })

  it('handles API errors gracefully', async () => {
    ;(
      subscriptionService.getUserSubscription as jest.Mock
    ).mockRejectedValueOnce(new Error('API error'))
    const { result } = renderHook(() => useSubscriptionStatus(testUser))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasValidSubscription).toBe(false)
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.subscription).toBe(null)
  })
})
