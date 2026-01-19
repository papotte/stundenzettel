import { render, screen, waitFor } from '@jest-setup'
import '@testing-library/jest-dom'

import type { PricingPlan } from '@/lib/types'
import {
  _resetPricingPlansCacheForTest,
  getPricingPlans,
} from '@/services/payment-service'

import PricingPage from '../page'

// Mock the payment service and pricing API used by PricingSection
jest.mock('@/services/payment-service', () => ({
  getPricingPlans: jest.fn(),
  paymentService: {
    createCheckoutSession: jest.fn(),
    redirectToCheckout: jest.fn(),
  },
  _resetPricingPlansCacheForTest: jest.fn(),
}))

// Mock useAuth hook to provide a simple unauthenticated context
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: null, loading: false }),
}))

// Mock useToast hook to avoid touching real toasts
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

const mockGetPricingPlans = getPricingPlans as jest.MockedFunction<
  typeof getPricingPlans
>

describe('PricingPage', () => {
  const mockPricingPlans: PricingPlan[] = [
    {
      id: 'individual-monthly',
      name: 'Individual Monthly',
      price: 9.99,
      currency: 'EUR',
      interval: 'month',
      features: ['Feature 1'],
      stripePriceId: 'price_monthly',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetPricingPlans.mockResolvedValue(mockPricingPlans)
    if (_resetPricingPlansCacheForTest) {
      _resetPricingPlansCacheForTest()
    }
  })

  it('renders the Pricing page with the standalone pricing section', async () => {
    render(<PricingPage />)

    // Header from the real PricingSection
    await waitFor(() => {
      expect(screen.getByText('landing.pricing.title')).toBeInTheDocument()
    })

    // Wait for plans to load and then verify one of the pricing plans is visible
    await waitFor(() => {
      expect(screen.getByText('Individual Monthly')).toBeInTheDocument()
    })
  })
})
