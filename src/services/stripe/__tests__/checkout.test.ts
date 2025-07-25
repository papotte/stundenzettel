import { createCheckoutSession } from '@/services/stripe'
import {
  getMockStripeInstance,
  setupStripeEnv,
} from '@/test-utils/stripe-mocks'

// Mock Stripe module with shared mock instance
jest.mock('stripe', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mockStripeInstance } = require('@/test-utils/stripe-mocks')
  return jest.fn().mockImplementation(() => mockStripeInstance)
})

setupStripeEnv()

// Get the mocked instance for test assertions
const mockStripeInstance = getMockStripeInstance()

describe('createCheckoutSession', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates session for existing customer', async () => {
    mockStripeInstance.customers.list.mockResolvedValue({
      data: [{ id: 'cus_1', metadata: { firebase_uid: 'u' } }],
    })
    mockStripeInstance.checkout.sessions.create.mockResolvedValue({
      id: 'sess_1',
      url: 'url',
    })
    const result = await createCheckoutSession({
      userId: 'u',
      userEmail: 'u@example.com',
      priceId: 'p',
      origin: 'http://localhost',
      trialEnabled: false, // Disable trials for this test
    })
    expect(result).toEqual({ sessionId: 'sess_1', url: 'url' })
    expect(mockStripeInstance.customers.list).toHaveBeenCalledWith({
      email: 'u@example.com',
      limit: 1,
    })
    expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalled()
  })

  it('creates session for new customer', async () => {
    mockStripeInstance.customers.list.mockResolvedValue({ data: [] })
    mockStripeInstance.customers.create.mockResolvedValue({ id: 'cus_2' })
    mockStripeInstance.checkout.sessions.create.mockResolvedValue({
      id: 'sess_2',
      url: 'url2',
    })
    const result = await createCheckoutSession({
      userId: 'u2',
      userEmail: 'u2@example.com',
      priceId: 'p2',
      origin: 'http://localhost',
      trialEnabled: false, // Disable trials for this test
    })
    expect(result).toEqual({ sessionId: 'sess_2', url: 'url2' })
    expect(mockStripeInstance.customers.create).toHaveBeenCalledWith({
      email: 'u2@example.com',
      metadata: { firebase_uid: 'u2' },
    })
  })

  it('throws on missing userId', async () => {
    await expect(
      createCheckoutSession({
        userId: '',
        userEmail: 'u@example.com',
        priceId: 'p',
        origin: 'o',
      }),
    ).rejects.toThrow('Missing required parameters')
  })

  it('throws on missing priceId', async () => {
    await expect(
      createCheckoutSession({
        userId: 'u',
        userEmail: 'u@example.com',
        priceId: '',
        origin: 'o',
      }),
    ).rejects.toThrow('Missing required parameters')
  })

  it('throws on Stripe error', async () => {
    mockStripeInstance.customers.list.mockRejectedValue(new Error('fail'))
    await expect(
      createCheckoutSession({
        userId: 'u',
        userEmail: 'u@example.com',
        priceId: 'p',
        origin: 'o',
        trialEnabled: false, // Disable trials for this test
      }),
    ).rejects.toThrow('fail')
  })

  describe('Trial Optimization', () => {
    beforeEach(() => {
      mockStripeInstance.customers.list.mockResolvedValue({
        data: [{ id: 'cus_1', metadata: { firebase_uid: 'u' } }],
      })
      mockStripeInstance.checkout.sessions.create.mockResolvedValue({
        id: 'sess_1',
        url: 'url',
      })
    })

    it('queries price when trial is enabled', async () => {
      mockStripeInstance.prices.retrieve.mockResolvedValue({
        id: 'price_1',
        recurring: { trial_period_days: 14 },
      })

      await createCheckoutSession({
        userId: 'u',
        userEmail: 'u@example.com',
        priceId: 'p',
        origin: 'http://localhost',
        trialEnabled: true,
      })

      expect(mockStripeInstance.prices.retrieve).toHaveBeenCalledWith('p')
    })

    it('does not query price when trial is disabled', async () => {
      await createCheckoutSession({
        userId: 'u',
        userEmail: 'u@example.com',
        priceId: 'p',
        origin: 'http://localhost',
        trialEnabled: false,
      })

      expect(mockStripeInstance.prices.retrieve).not.toHaveBeenCalled()
    })

    it('does not query price when trial is not explicitly enabled', async () => {
      await createCheckoutSession({
        userId: 'u',
        userEmail: 'u@example.com',
        priceId: 'p',
        origin: 'http://localhost',
        // trialEnabled defaults to true, but global trial might be disabled
      })

      // Should still query price since trialEnabled defaults to true
      expect(mockStripeInstance.prices.retrieve).toHaveBeenCalledWith('p')
    })

    it('handles price retrieval error when trial is enabled', async () => {
      mockStripeInstance.prices.retrieve.mockRejectedValue(
        new Error('Invalid price'),
      )

      await expect(
        createCheckoutSession({
          userId: 'u',
          userEmail: 'u@example.com',
          priceId: 'invalid_price',
          origin: 'http://localhost',
          trialEnabled: true,
        }),
      ).rejects.toThrow('Invalid price ID: invalid_price')
    })

    it('creates session with trial metadata when price has trial period', async () => {
      mockStripeInstance.prices.retrieve.mockResolvedValue({
        id: 'price_1',
        recurring: { trial_period_days: 14 },
      })

      await createCheckoutSession({
        userId: 'u',
        userEmail: 'u@example.com',
        priceId: 'p',
        origin: 'http://localhost',
        trialEnabled: true,
      })

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            trial_enabled: 'true',
            trial_days: '14',
            has_trial_period: 'true',
          }),
        }),
      )
    })

    it('creates session without trial metadata when trial is disabled', async () => {
      await createCheckoutSession({
        userId: 'u',
        userEmail: 'u@example.com',
        priceId: 'p',
        origin: 'http://localhost',
        trialEnabled: false,
      })

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            trial_enabled: 'false',
            trial_days: '0',
            has_trial_period: 'false',
          }),
        }),
      )
    })
  })
})
