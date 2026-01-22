import type { Subscription } from '@/lib/types'

export interface MockSubscriptionContext {
  hasValidSubscription: boolean | null
  loading: boolean
  error: Error | null
  subscription: Subscription | null
  ownerId: string | null
  invalidateSubscription: jest.Mock
}

/**
 * Creates a mock subscription context for testing
 */
export const createMockSubscriptionContext = (
  overrides: Partial<MockSubscriptionContext> = {},
): MockSubscriptionContext => {
  return {
    hasValidSubscription: null,
    loading: false,
    error: null,
    subscription: null,
    ownerId: null,
    invalidateSubscription: jest.fn(),
    ...overrides,
  }
}

/**
 * Common subscription scenarios for testing
 */
export const subscriptionScenarios = {
  subscribed: (subscriptionOverrides?: Partial<Subscription>) =>
    createMockSubscriptionContext({
      hasValidSubscription: true,
      loading: false,
      subscription: {
        id: 'sub_test',
        userId: 'test-user-id',
        stripeSubscriptionId: 'sub_stripe_test',
        status: 'active',
        currentPeriodEnd: new Date(),
        ...subscriptionOverrides,
      } as Subscription,
      ownerId: 'test-user-id',
    }),

  notSubscribed: () =>
    createMockSubscriptionContext({
      hasValidSubscription: false,
      loading: false,
      subscription: null,
      ownerId: null,
    }),

  loading: () =>
    createMockSubscriptionContext({
      hasValidSubscription: null,
      loading: true,
      subscription: null,
      ownerId: null,
    }),

  withError: (error: Error) =>
    createMockSubscriptionContext({
      hasValidSubscription: false,
      loading: false,
      error,
      subscription: null,
      ownerId: null,
    }),
}
