import { render, screen, waitFor } from '@jest-setup'
import '@testing-library/jest-dom'

import type { PricingPlan } from '@/lib/types'

import PricingPage from '../page'

jest.mock('@/services/stripe/stripe-cached', () => ({
  getCachedPricingPlans: jest.fn(),
}))

// Mock the payment service used by PricingSection for checkout
jest.mock('@/services/payment-service', () => ({
  paymentService: {
    createCheckoutSession: jest.fn(),
    redirectToCheckout: jest.fn(),
  },
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

const mockPlans: PricingPlan[] = [
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

describe('PricingPage', () => {
  beforeEach(async () => {
    const { getCachedPricingPlans } = await import(
      '@/services/stripe/stripe-cached'
    )
    ;(getCachedPricingPlans as jest.Mock).mockResolvedValue(mockPlans)
  })

  it('renders the Pricing page with the standalone pricing section', async () => {
    render(await PricingPage())

    await waitFor(() => {
      expect(screen.getByText('landing.pricing.title')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Individual Monthly')).toBeInTheDocument()
    })
  })
})
