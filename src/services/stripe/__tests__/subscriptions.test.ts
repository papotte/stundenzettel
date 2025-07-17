import {
  getMockStripeInstance,
  setupStripeEnv,
} from '@/test-utils/stripe-mocks'

import { getUserSubscription } from '../subscriptions'

// Mock Stripe module with shared mock instance
jest.mock('stripe', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mockStripeInstance } = require('@/test-utils/stripe-mocks')
  return jest.fn().mockImplementation(() => mockStripeInstance)
})

setupStripeEnv()

// Get the mocked instance for test assertions
const mockStripeInstance = getMockStripeInstance()

describe('getUserSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns subscription for user with active subscription', async () => {
    const mockSubscription = {
      id: 'sub_123',
      customer: 'cus_123',
      status: 'active',
      current_period_start: 1640995200,
      current_period_end: 1643673600,
      cancel_at_period_end: false,
      created: 1640995200,
      items: {
        data: [
          {
            price: { id: 'price_123' },
            quantity: 1,
          },
        ],
      },
    }

    mockStripeInstance.customers.list.mockResolvedValue({
      data: [{ id: 'cus_123' }],
    })
    mockStripeInstance.subscriptions.list.mockResolvedValue({
      data: [mockSubscription],
    })

    const result = await getUserSubscription('user@example.com')

    expect(result).toEqual({
      stripeSubscriptionId: 'sub_123',
      stripeCustomerId: 'cus_123',
      status: 'active',
      currentPeriodStart: new Date(1640995200000),
      currentPeriodEnd: new Date(1643673600000),
      cancelAtPeriodEnd: false,
      priceId: 'price_123',
      quantity: 1,
      updatedAt: new Date(1640995200000),
    })
  })

  it('returns null when customer not found', async () => {
    mockStripeInstance.customers.list.mockResolvedValue({ data: [] })

    const result = await getUserSubscription('user@example.com')

    expect(result).toBeNull()
  })

  it('returns null when customer has no subscriptions', async () => {
    mockStripeInstance.customers.list.mockResolvedValue({
      data: [{ id: 'cus_123' }],
    })
    mockStripeInstance.subscriptions.list.mockResolvedValue({ data: [] })

    const result = await getUserSubscription('user@example.com')

    expect(result).toBeNull()
  })

  it('throws on missing userId', async () => {
    await expect(getUserSubscription('')).rejects.toThrow('User ID is required')
  })

  it('throws on Stripe error', async () => {
    mockStripeInstance.customers.list.mockRejectedValue(new Error('fail'))
    await expect(getUserSubscription('user@example.com')).rejects.toThrow(
      'fail',
    )
  })
})
