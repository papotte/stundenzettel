import {
  getMockStripeInstance,
  setupStripeEnv,
} from '@/test-utils/stripe-mocks'

import { getPriceTrialInfo } from '../utils'

// Mock Stripe module with shared mock instance
jest.mock('stripe', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mockStripeInstance } = require('@/test-utils/stripe-mocks')
  return jest.fn().mockImplementation(() => mockStripeInstance)
})

setupStripeEnv()

// Get the mocked instance for test assertions
const mockStripeInstance = getMockStripeInstance()

describe('getPriceTrialInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns trial info for price with trial period', async () => {
    mockStripeInstance.prices.retrieve.mockResolvedValue({
      id: 'price_1',
      recurring: { trial_period_days: 14 },
    })

    const result = await getPriceTrialInfo('price_1')

    expect(result).toEqual({
      hasTrialPeriod: true,
      trialDays: 14,
    })
    expect(mockStripeInstance.prices.retrieve).toHaveBeenCalledWith('price_1')
  })

  it('returns no trial info for price without trial period', async () => {
    mockStripeInstance.prices.retrieve.mockResolvedValue({
      id: 'price_1',
      recurring: { trial_period_days: 0 },
    })

    const result = await getPriceTrialInfo('price_1')

    expect(result).toEqual({
      hasTrialPeriod: false,
      trialDays: 0,
    })
  })

  it('returns no trial info for price without recurring data', async () => {
    mockStripeInstance.prices.retrieve.mockResolvedValue({
      id: 'price_1',
      // No recurring field
    })

    const result = await getPriceTrialInfo('price_1')

    expect(result).toEqual({
      hasTrialPeriod: false,
      trialDays: 0,
    })
  })

  it('returns no trial info for price with null trial period', async () => {
    mockStripeInstance.prices.retrieve.mockResolvedValue({
      id: 'price_1',
      recurring: { trial_period_days: null },
    })

    const result = await getPriceTrialInfo('price_1')

    expect(result).toEqual({
      hasTrialPeriod: false,
      trialDays: 0,
    })
  })

  it('throws error for invalid price ID', async () => {
    mockStripeInstance.prices.retrieve.mockRejectedValue(
      new Error('Invalid price'),
    )

    await expect(getPriceTrialInfo('invalid_price')).rejects.toThrow(
      'Invalid price ID: invalid_price',
    )
  })

  it('handles Stripe API errors gracefully', async () => {
    mockStripeInstance.prices.retrieve.mockRejectedValue(
      new Error('Network error'),
    )

    await expect(getPriceTrialInfo('price_1')).rejects.toThrow(
      'Invalid price ID: price_1',
    )
  })
})
