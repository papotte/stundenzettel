import { renderHook, waitFor } from '@jest-setup'

import { getSubscriptionForUserAction } from '@/app/actions/get-subscription'

import { useSubscriptionStatus } from '../use-subscription-status'

jest.unmock('@/hooks/use-subscription-status')

jest.mock('@/app/actions/get-subscription', () => ({
  getSubscriptionForUserAction: jest.fn(),
}))

describe('useSubscriptionStatus', () => {
  const testUser = { uid: 'user123' }
  const baseSub = {
    currentPeriodStart: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    stripeSubscriptionId: 'sub_1',
    stripeCustomerId: 'cus_1',
    cancelAtPeriodEnd: false,
    priceId: 'price_1',
  }
  const validSub = { ...baseSub, status: 'active' as const }
  const trialSub = { ...baseSub, status: 'trialing' as const }
  const invalidSub = { ...baseSub, status: 'canceled' as const }
  const teamSub = {
    ...baseSub,
    status: 'active' as const,
    planName: 'Team Plan',
  }

  beforeEach(() => {
    jest.clearAllMocks()
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

  it('calls getSubscriptionForUserAction and returns true for active subscription', async () => {
    ;(getSubscriptionForUserAction as jest.Mock).mockResolvedValueOnce({
      hasValidSubscription: true,
      subscription: validSub,
    })
    const { result } = renderHook(() => useSubscriptionStatus(testUser))
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasValidSubscription).toBe(true)
    expect(result.current.subscription).toEqual(validSub)
    expect(getSubscriptionForUserAction).toHaveBeenCalledWith('user123')
  })

  it('returns true for trialing subscription', async () => {
    ;(getSubscriptionForUserAction as jest.Mock).mockResolvedValueOnce({
      hasValidSubscription: true,
      subscription: trialSub,
    })
    const { result } = renderHook(() => useSubscriptionStatus(testUser))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasValidSubscription).toBe(true)
    expect(result.current.subscription).toEqual(trialSub)
  })

  it('returns false for invalid subscription', async () => {
    ;(getSubscriptionForUserAction as jest.Mock).mockResolvedValueOnce({
      hasValidSubscription: false,
      subscription: invalidSub,
    })
    const { result } = renderHook(() => useSubscriptionStatus(testUser))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasValidSubscription).toBe(false)
    expect(result.current.subscription).toEqual(invalidSub)
  })

  it('returns true for team subscription when user has no individual subscription', async () => {
    ;(getSubscriptionForUserAction as jest.Mock).mockResolvedValueOnce({
      hasValidSubscription: true,
      subscription: teamSub,
    })
    const { result } = renderHook(() => useSubscriptionStatus(testUser))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasValidSubscription).toBe(true)
    expect(result.current.subscription).toEqual(teamSub)
    expect(result.current.subscription?.planName).toBe('Team Plan')
  })

  it('returns cached value for the same user and does not call action again', async () => {
    ;(getSubscriptionForUserAction as jest.Mock).mockResolvedValueOnce({
      hasValidSubscription: true,
      subscription: validSub,
    })
    const { result, rerender } = renderHook(
      ({ user }) => useSubscriptionStatus(user),
      { initialProps: { user: testUser } },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasValidSubscription).toBe(true)
    expect(getSubscriptionForUserAction).toHaveBeenCalledTimes(1)
    rerender({ user: testUser })
    expect(result.current.hasValidSubscription).toBe(true)
    expect(getSubscriptionForUserAction).toHaveBeenCalledTimes(1)
  })

  it('handles API errors gracefully', async () => {
    ;(getSubscriptionForUserAction as jest.Mock).mockRejectedValueOnce(
      new Error('API error'),
    )
    const { result } = renderHook(() => useSubscriptionStatus(testUser))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasValidSubscription).toBe(false)
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.subscription).toBe(null)
  })
})
