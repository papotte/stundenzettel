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
      teamId: 't',
      priceId: 'p',
      quantity: 2,
      origin: 'http://localhost',
    })
    expect(result).toEqual({ sessionId: 'sess_1', url: 'url' })
    expect(mockStripeInstance.customers.list).toHaveBeenCalledWith({
      email: 'u',
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
      teamId: 't2',
      priceId: 'p2',
      quantity: 3,
      origin: 'http://localhost',
    })
    expect(result).toEqual({ sessionId: 'sess_2', url: 'url2' })
    expect(mockStripeInstance.customers.create).toHaveBeenCalledWith({
      email: 'u2',
      metadata: { userId: 'u2' },
    })
  })

  it('throws on missing userId', async () => {
    await expect(
      createTeamCheckoutSession({
        userId: '',
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
        teamId: 't',
        priceId: 'p',
        quantity: 1,
        origin: 'o',
      }),
    ).rejects.toThrow('fail')
  })
})
