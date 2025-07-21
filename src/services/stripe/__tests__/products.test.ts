import { getStripeProducts } from '@/services/stripe'
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


describe('getStripeProducts', () => {
  // Get the mocked instance for test assertions
  const mockStripeInstance = getMockStripeInstance();
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns products with prices and tiered pricing info', async () => {
    const mockProducts = [
      {
        id: 'prod_1',
        name: 'Test Product',
        description: 'Test Description',
        metadata: { key: 'value' },
      },
    ]

    const mockPrices = [
      {
        id: 'price_1',
        product: 'prod_1',
        unit_amount: 1000,
        currency: 'usd',
        recurring: { interval: 'month', interval_count: 1 },
        metadata: { priceKey: 'priceValue' },
        tiers: [
          {
            up_to: 10,
            unit_amount: 1000,
            flat_amount: null,
          },
        ],
      },
    ]

    mockStripeInstance.products.list.mockResolvedValue({ data: mockProducts })
    mockStripeInstance.prices.list.mockResolvedValue({ data: mockPrices })
    mockStripeInstance.prices.retrieve.mockResolvedValue(mockPrices[0])

    const result = await getStripeProducts()

    expect(result).toEqual([
      {
        id: 'prod_1',
        name: 'Test Product',
        description: 'Test Description',
        metadata: { key: 'value' },
        prices: [
          {
            id: 'price_1',
            product: 'prod_1',
            unit_amount: 1000,
            currency: 'usd',
            recurring: { interval: 'month', interval_count: 1 },
            metadata: { priceKey: 'priceValue' },
            tiers: [
              {
                up_to: 10,
                unit_amount: 1000,
                flat_amount: null,
              },
            ],
          },
        ],
      },
    ])
  })

  it('throws on Stripe error', async () => {
    mockStripeInstance.products.list.mockRejectedValue(new Error('fail'))
    await expect(getStripeProducts()).rejects.toThrow(
      'Failed to fetch products',
    )
  })
})
