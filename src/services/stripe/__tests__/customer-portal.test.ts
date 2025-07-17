import { createCustomerPortalSession } from '@/services/stripe'
import {
  getMockStripeInstance,
  setupStripeEnv,
} from '@/test-utils/stripe-mocks'

// Mock Stripe module with shared mock instance
jest.mock('stripe', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { mockStripeInstance } = require('@/test-utils/stripe-mocks')
  return jest.fn().mockImplementation(() => mockStripeInstance)
})

setupStripeEnv()

// Get the mocked instance for test assertions
const mockStripeInstance = getMockStripeInstance()

describe('createCustomerPortalSession', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates portal session for existing customer', async () => {
    mockStripeInstance.customers.list.mockResolvedValue({
      data: [{ id: 'cus_1' }],
    })
    mockStripeInstance.billingPortal.sessions.create.mockResolvedValue({
      url: 'portal_url',
    })
    const result = await createCustomerPortalSession({
      userId: 'u',
      origin: 'http://localhost',
    })
    expect(result).toEqual({ url: 'portal_url' })
    expect(mockStripeInstance.customers.list).toHaveBeenCalledWith({
      email: 'u',
      limit: 1,
    })
    expect(
      mockStripeInstance.billingPortal.sessions.create,
    ).toHaveBeenCalledWith({
      customer: 'cus_1',
      return_url: 'http://localhost/settings',
    })
  })

  it('uses custom return URL when provided', async () => {
    mockStripeInstance.customers.list.mockResolvedValue({
      data: [{ id: 'cus_1' }],
    })
    mockStripeInstance.billingPortal.sessions.create.mockResolvedValue({
      url: 'portal_url',
    })
    const result = await createCustomerPortalSession({
      userId: 'u',
      returnUrl: 'https://custom-return.com',
      origin: 'http://localhost',
    })
    expect(result).toEqual({ url: 'portal_url' })
    expect(
      mockStripeInstance.billingPortal.sessions.create,
    ).toHaveBeenCalledWith({
      customer: 'cus_1',
      return_url: 'https://custom-return.com',
    })
  })

  it('throws on missing userId', async () => {
    await expect(
      createCustomerPortalSession({ userId: '', origin: 'o' }),
    ).rejects.toThrow('Missing required parameters')
  })

  it('throws when customer not found', async () => {
    mockStripeInstance.customers.list.mockResolvedValue({ data: [] })
    await expect(
      createCustomerPortalSession({ userId: 'u', origin: 'o' }),
    ).rejects.toThrow('Customer not found')
  })

  it('throws on Stripe error', async () => {
    mockStripeInstance.customers.list.mockRejectedValue(new Error('fail'))
    await expect(
      createCustomerPortalSession({ userId: 'u', origin: 'o' }),
    ).rejects.toThrow('fail')
  })
})
