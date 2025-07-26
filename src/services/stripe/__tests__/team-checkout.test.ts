import { createTeamCheckoutSession } from '@/services/stripe'
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

describe('createTeamCheckoutSession', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates session for existing customer', async () => {
    mockStripeInstance.customers.list.mockResolvedValue({
      data: [{ id: 'cus_1' }],
    })
    mockStripeInstance.checkout.sessions.create.mockResolvedValue({
      id: 'sess_1',
      url: 'url',
    })
    const result = await createTeamCheckoutSession({
      userId: 'u',
      userEmail: 'u@example.com',
      teamId: 't',
      priceId: 'p',
      quantity: 2,
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
    const result = await createTeamCheckoutSession({
      userId: 'u2',
      userEmail: 'u2@example.com',
      teamId: 't2',
      priceId: 'p2',
      quantity: 3,
      origin: 'http://localhost',
      trialEnabled: false, // Disable trials for this test
    })
    expect(result).toEqual({ sessionId: 'sess_2', url: 'url2' })
    expect(mockStripeInstance.customers.create).toHaveBeenCalledWith({
      email: 'u2@example.com',
      metadata: { userId: 'u2' },
    })
  })

  it('throws on missing userId', async () => {
    await expect(
      createTeamCheckoutSession({
        userId: '',
        userEmail: 'test@example.com',
        teamId: 't',
        priceId: 'p',
        quantity: 1,
        origin: 'o',
      }),
    ).rejects.toThrow('Missing required parameters')
  })

  it('throws on missing teamId', async () => {
    await expect(
      createTeamCheckoutSession({
        userId: 'u',
        userEmail: 'u@example.com',
        teamId: '',
        priceId: 'p',
        quantity: 1,
        origin: 'o',
      }),
    ).rejects.toThrow('Missing required parameters')
  })

  it('throws on missing priceId', async () => {
    await expect(
      createTeamCheckoutSession({
        userId: 'u',
        userEmail: 'u@example.com',
        teamId: 't',
        priceId: '',
        quantity: 1,
        origin: 'o',
      }),
    ).rejects.toThrow('Missing required parameters')
  })

  it('throws on missing quantity', async () => {
    await expect(
      createTeamCheckoutSession({
        userId: 'u',
        userEmail: 'u@example.com',
        teamId: 't',
        priceId: 'p',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        quantity: undefined as any,
        origin: 'o',
      }),
    ).rejects.toThrow('Missing required parameters')
  })

  it('throws on Stripe error', async () => {
    mockStripeInstance.customers.list.mockRejectedValue(new Error('fail'))
    await expect(
      createTeamCheckoutSession({
        userId: 'u',
        userEmail: 'u@example.com',
        teamId: 't',
        priceId: 'p',
        quantity: 1,
        origin: 'o',
        trialEnabled: false, // Disable trials for this test
      }),
    ).rejects.toThrow('fail')
  })

  describe('Trial Optimization', () => {
    beforeEach(() => {
      mockStripeInstance.customers.list.mockResolvedValue({
        data: [{ id: 'cus_1' }],
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

      await createTeamCheckoutSession({
        userId: 'u',
        userEmail: 'u@example.com',
        teamId: 't',
        priceId: 'p',
        quantity: 2,
        origin: 'http://localhost',
        trialEnabled: true,
      })

      expect(mockStripeInstance.prices.retrieve).toHaveBeenCalledWith('p')
    })

    it('does not query price when trial is disabled', async () => {
      await createTeamCheckoutSession({
        userId: 'u',
        userEmail: 'u@example.com',
        teamId: 't',
        priceId: 'p',
        quantity: 2,
        origin: 'http://localhost',
        trialEnabled: false,
      })

      expect(mockStripeInstance.prices.retrieve).not.toHaveBeenCalled()
    })

    it('creates session with trial metadata when price has trial period', async () => {
      mockStripeInstance.prices.retrieve.mockResolvedValue({
        id: 'price_1',
        recurring: { trial_period_days: 14 },
      })

      await createTeamCheckoutSession({
        userId: 'u',
        userEmail: 'u@example.com',
        teamId: 't',
        priceId: 'p',
        quantity: 2,
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
      await createTeamCheckoutSession({
        userId: 'u',
        userEmail: 'u@example.com',
        teamId: 't',
        priceId: 'p',
        quantity: 2,
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
