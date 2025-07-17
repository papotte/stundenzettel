// Mock Stripe instance that can be used across all tests
export const mockStripeInstance = {
  customers: {
    list: jest.fn(),
    create: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  billingPortal: {
    sessions: {
      create: jest.fn(),
    },
  },
  subscriptions: {
    list: jest.fn(),
  },
  products: {
    list: jest.fn(),
  },
  prices: {
    list: jest.fn(),
    retrieve: jest.fn(),
  },
}

// Helper to set up Stripe environment variables for tests
export function setupStripeEnv() {
  process.env.STRIPE_SECRET_KEY = 'test_stripe_secret_key'
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'test_stripe_publishable_key'
}

// Get the mocked Stripe instance for test assertions
export const getMockStripeInstance = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  return (require('stripe') as any)() as typeof mockStripeInstance
}

// Reset all Stripe mocks
export const resetStripeMocks = () => {
  jest.clearAllMocks()
  Object.values(mockStripeInstance).forEach((service) => {
    if (typeof service === 'object' && service !== null) {
      Object.values(service).forEach((method) => {
        if (typeof method === 'function' && 'mockClear' in method) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(method as any).mockClear()
        }
      })
    }
  })
}

/*
JEST MOCK PATTERN FOR TEST FILES:
==================================

To avoid code duplication, use this pattern in all Stripe test files:

```typescript
import { setupStripeEnv, getMockStripeInstance } from '../../../test-utils/stripe-mocks'

// Mock Stripe module with shared mock instance
jest.mock('stripe', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { mockStripeInstance } = require('../../../test-utils/stripe-mocks')
  return jest.fn().mockImplementation(() => mockStripeInstance)
})

setupStripeEnv()

import { yourServiceFunction } from '../your-service'

// Get the mocked instance for test assertions
const mockStripeInstance = getMockStripeInstance()
```

This pattern:
- Uses the shared mockStripeInstance from this file
- Minimizes code duplication
- Is Prettier-friendly (imports stay at top)
- Uses ESLint disable comments only where necessary
- Provides consistent mocking across all tests
*/
