import * as subscriptionServer from '@/lib/subscription-server'

import { getSubscriptionForUserAction } from '../get-subscription'

jest.mock('@/lib/subscription-server', () => ({
  getSubscriptionForUser: jest.fn(),
}))

const mockGetSubscriptionForUser = jest.mocked(
  subscriptionServer.getSubscriptionForUser,
)

describe('getSubscriptionForUserAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns no subscription when userId is undefined', async () => {
    const result = await getSubscriptionForUserAction(undefined)

    expect(result).toEqual({
      hasValidSubscription: false,
      subscription: null,
    })
    expect(mockGetSubscriptionForUser).not.toHaveBeenCalled()
  })

  it('returns no subscription when userId is empty string', async () => {
    const result = await getSubscriptionForUserAction('')

    expect(result).toEqual({
      hasValidSubscription: false,
      subscription: null,
    })
    expect(mockGetSubscriptionForUser).not.toHaveBeenCalled()
  })

  it('calls getSubscriptionForUser with userId and returns its result', async () => {
    const userId = 'user-123'
    const expected = {
      hasValidSubscription: true,
      subscription: {
        stripeSubscriptionId: 'sub_1',
        stripeCustomerId: 'cus_1',
        status: 'active' as const,
        currentPeriodStart: new Date(),
        cancelAtPeriodEnd: false,
        priceId: 'price_1',
        planName: 'Pro',
        planDescription: 'Pro plan',
        quantity: 1,
        updatedAt: new Date(),
      },
    }
    mockGetSubscriptionForUser.mockResolvedValue(expected)

    const result = await getSubscriptionForUserAction(userId)

    expect(mockGetSubscriptionForUser).toHaveBeenCalledTimes(1)
    expect(mockGetSubscriptionForUser).toHaveBeenCalledWith(userId)
    expect(result).toEqual(expected)
  })

  it('returns no-subscription result when getSubscriptionForUser returns it', async () => {
    mockGetSubscriptionForUser.mockResolvedValue({
      hasValidSubscription: false,
      subscription: null,
    })

    const result = await getSubscriptionForUserAction('user-456')

    expect(mockGetSubscriptionForUser).toHaveBeenCalledWith('user-456')
    expect(result).toEqual({
      hasValidSubscription: false,
      subscription: null,
    })
  })
})
