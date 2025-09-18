import { renderHook } from '@testing-library/react'

import { usePaywall } from '@/hooks/use-paywall'
import * as useAuth from '@/hooks/use-auth'
import * as useSubscriptionStatus from '@/hooks/use-subscription-status'

// Mock the hooks
jest.mock('@/hooks/use-auth')
jest.mock('@/hooks/use-subscription-status')

const mockUseAuth = useAuth as jest.Mocked<typeof useAuth>
const mockUseSubscriptionStatus = useSubscriptionStatus as jest.Mocked<typeof useSubscriptionStatus>

describe('usePaywall', () => {
  const mockUser = { uid: 'test-user-id' }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.useAuth.mockReturnValue({
      user: mockUser,
      loading: false,
    })
  })

  it('should allow all features for users with valid subscription', () => {
    mockUseSubscriptionStatus.useSubscriptionStatus.mockReturnValue({
      hasValidSubscription: true,
      loading: false,
      error: null,
      subscription: {
        status: 'active',
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        currentPeriodStart: new Date(),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        updatedAt: new Date(),
      },
    })

    const { result } = renderHook(() => usePaywall())

    expect(result.current.hasValidSubscription).toBe(true)
    expect(result.current.canAccess('companySettings')).toBe(true)
    expect(result.current.canAccess('exportFunctionality')).toBe(true)
    expect(result.current.canAccess('manualTimeEntry')).toBe(true)
    expect(result.current.canAccess('editTimeEntry')).toBe(true)
    expect(result.current.canAccess('deleteTimeEntry')).toBe(true)
    expect(result.current.canAccess('specialEntries')).toBe(true)
    expect(result.current.requiresUpgrade('companySettings')).toBe(false)
  })

  it('should block all premium features for users without valid subscription', () => {
    mockUseSubscriptionStatus.useSubscriptionStatus.mockReturnValue({
      hasValidSubscription: false,
      loading: false,
      error: null,
      subscription: null,
    })

    const { result } = renderHook(() => usePaywall())

    expect(result.current.hasValidSubscription).toBe(false)
    expect(result.current.canAccess('companySettings')).toBe(false)
    expect(result.current.canAccess('exportFunctionality')).toBe(false)
    expect(result.current.canAccess('manualTimeEntry')).toBe(false)
    expect(result.current.canAccess('editTimeEntry')).toBe(false)
    expect(result.current.canAccess('deleteTimeEntry')).toBe(false)
    expect(result.current.canAccess('specialEntries')).toBe(false)
    expect(result.current.requiresUpgrade('companySettings')).toBe(true)
  })

  it('should show loading state when subscription status is loading', () => {
    mockUseSubscriptionStatus.useSubscriptionStatus.mockReturnValue({
      hasValidSubscription: null,
      loading: true,
      error: null,
      subscription: null,
    })

    const { result } = renderHook(() => usePaywall())

    expect(result.current.isLoading).toBe(true)
  })

  it('should allow features for users with trial subscription', () => {
    mockUseSubscriptionStatus.useSubscriptionStatus.mockReturnValue({
      hasValidSubscription: true,
      loading: false,
      error: null,
      subscription: {
        status: 'trialing',
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        currentPeriodStart: new Date(),
        cancelAtPeriodEnd: false,
        priceId: 'price_123',
        updatedAt: new Date(),
        trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    })

    const { result } = renderHook(() => usePaywall())

    expect(result.current.hasValidSubscription).toBe(true)
    expect(result.current.canAccess('companySettings')).toBe(true)
    expect(result.current.canAccess('exportFunctionality')).toBe(true)
  })
})