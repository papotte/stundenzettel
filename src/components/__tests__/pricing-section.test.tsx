import React from 'react'

import { render, screen, waitFor } from '@jest-setup'
import userEvent from '@testing-library/user-event'

import type { PricingPlan } from '@/lib/types'
import { paymentService } from '@/services/payment-service'
import { createMockAuthContext, createMockUser } from '@/test-utils/auth-mocks'

import PricingSection from '../pricing-section'

const mockUsePricingPlans = jest.fn()
jest.mock('@/hooks/use-pricing-plans', () => ({
  usePricingPlans: (...args: unknown[]) => mockUsePricingPlans(...args),
}))

jest.mock('@/services/payment-service', () => ({
  paymentService: {
    createCheckoutSession: jest.fn(),
    redirectToCheckout: jest.fn(),
  },
  _resetPricingPlansCacheForTest: jest.fn(),
}))

// Mock window.location
const mockLocation = {
  href: '',
  origin: 'http://localhost:3000',
  search: '',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

const mockCreateCheckoutSession =
  paymentService.createCheckoutSession as jest.MockedFunction<
    typeof paymentService.createCheckoutSession
  >
const mockRedirectToCheckout =
  paymentService.redirectToCheckout as jest.MockedFunction<
    typeof paymentService.redirectToCheckout
  >

const mockAuthContext = createMockAuthContext()

// Mock useAuth hook
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

// Mock useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(component)
}

describe('PricingSection', () => {
  const mockPricingPlans: PricingPlan[] = [
    {
      id: 'individual-monthly',
      name: 'Individual Monthly',
      price: 9.99,
      currency: 'EUR',
      interval: 'month',
      features: ['Feature 1', 'Feature 2'],
      stripePriceId: 'price_monthly',
    },
    {
      id: 'individual-yearly',
      name: 'Individual Yearly',
      price: 99.99,
      currency: 'EUR',
      interval: 'year',
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
      stripePriceId: 'price_yearly',
    },
    {
      id: 'team-monthly',
      name: 'Team Monthly',
      price: 19.99,
      currency: 'EUR',
      interval: 'month',
      features: ['Team Feature 1', 'Team Feature 2'],
      stripePriceId: 'price_team_monthly',
      maxUsers: 10,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthContext.user = null
    mockAuthContext.loading = false
    mockLocation.href = ''
    mockLocation.search = ''
    mockUsePricingPlans.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    })
  })

  describe('Plan Loading', () => {
    it('shows loading state while fetching plans', async () => {
      mockUsePricingPlans.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      })

      renderWithProviders(<PricingSection />)

      expect(
        screen.getByText('landing.pricing.loadingPlans'),
      ).toBeInTheDocument()
      expect(screen.getByTestId('loading-icon')).toBeInTheDocument()
    })

    it('displays pricing plans when loaded successfully', async () => {
      mockUsePricingPlans.mockReturnValue({
        data: mockPricingPlans,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithProviders(<PricingSection />)

      await waitFor(() => {
        expect(screen.getByText('Individual Monthly')).toBeInTheDocument()
        expect(screen.getByText('Team Monthly')).toBeInTheDocument()
      })
    })

    it('handles plan loading errors gracefully', async () => {
      mockUsePricingPlans.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithProviders(<PricingSection />)

      await waitFor(() => {
        expect(
          screen.queryByText('landing.pricing.loadingPlans'),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Billing Toggle', () => {
    beforeEach(() => {
      mockUsePricingPlans.mockReturnValue({
        data: mockPricingPlans,
        isLoading: false,
        isError: false,
        error: null,
      })
    })

    it('shows monthly plans by default', async () => {
      renderWithProviders(<PricingSection />)

      await waitFor(() => {
        expect(screen.getByText('Individual Monthly')).toBeInTheDocument()
        expect(screen.queryByText('Individual Yearly')).not.toBeInTheDocument()
      })
    })

    it('toggles between monthly and yearly plans', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PricingSection />)

      await waitFor(() => {
        expect(screen.getByText('Individual Monthly')).toBeInTheDocument()
      })

      // Click yearly toggle
      const yearlyToggle = screen.getByRole('switch', {
        name: 'landing.pricing.monthly landing.pricing.yearly',
      })
      await user.click(yearlyToggle)

      await waitFor(() => {
        expect(screen.getByText('Individual Yearly')).toBeInTheDocument()
        expect(screen.queryByText('Individual Monthly')).not.toBeInTheDocument()
      })

      // Click monthly toggle back
      const monthlyToggle = screen.getByRole('switch', {
        name: 'landing.pricing.monthly landing.pricing.yearly',
      })
      await user.click(monthlyToggle)

      await waitFor(() => {
        expect(screen.getByText('Individual Monthly')).toBeInTheDocument()
        expect(screen.queryByText('Individual Yearly')).not.toBeInTheDocument()
      })
    })

    it('shows save badge when yearly is selected', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PricingSection />)

      await waitFor(() => {
        expect(screen.getByText('Individual Monthly')).toBeInTheDocument()
      })

      // Click yearly toggle
      const yearlyToggle = screen.getByRole('switch', {
        name: 'landing.pricing.monthly landing.pricing.yearly',
      })
      await user.click(yearlyToggle)

      await waitFor(() => {
        expect(screen.getByText('landing.pricing.save20')).toBeInTheDocument()
      })
    })
  })

  describe('Subscription Flow', () => {
    beforeEach(() => {
      mockUsePricingPlans.mockReturnValue({
        data: mockPricingPlans,
        isLoading: false,
        isError: false,
        error: null,
      })
    })

    it('redirects unauthenticated users to login when subscribing', async () => {
      const user = userEvent.setup()
      mockAuthContext.user = null

      renderWithProviders(<PricingSection />)

      await waitFor(() => {
        expect(screen.getByText('Individual Monthly')).toBeInTheDocument()
      })

      const subscribeButton = screen.getByRole('button', {
        name: 'landing.pricing.getStarted',
      })
      await user.click(subscribeButton)

      expect(mockLocation.href).toBe(
        '/login?returnUrl=http%3A%2F%2Flocalhost%3A3000%2Fpricing%3Fplan%3Dindividual-monthly',
      )
    })

    it('creates checkout session for authenticated users', async () => {
      const user = userEvent.setup()
      mockAuthContext.user = createMockUser({
        uid: 'user123',
        email: 'test@example.com',
      })
      mockCreateCheckoutSession.mockResolvedValue({
        url: 'https://checkout.stripe.com/test',
        sessionId: 'cs_test_123',
      })
      mockRedirectToCheckout.mockResolvedValue(undefined)

      renderWithProviders(<PricingSection />)

      await waitFor(() => {
        expect(screen.getByText('Individual Monthly')).toBeInTheDocument()
      })

      const subscribeButton = screen.getByRole('button', {
        name: 'landing.pricing.getStarted',
      })
      await user.click(subscribeButton)

      await waitFor(() => {
        expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
          'user123',
          'test@example.com',
          'price_monthly',
          'http://localhost:3000/subscription?success=true',
          'http://localhost:3000/pricing?canceled=true',
          true,
          undefined,
        )
        expect(mockRedirectToCheckout).toHaveBeenCalledWith(
          'https://checkout.stripe.com/test',
        )
      })
    })

    it('handles checkout session creation errors', async () => {
      const user = userEvent.setup()
      mockAuthContext.user = createMockUser({
        uid: 'user123',
        email: 'test@example.com',
      })
      mockCreateCheckoutSession.mockRejectedValue(new Error('Checkout failed'))

      renderWithProviders(<PricingSection />)

      await waitFor(() => {
        expect(screen.getByText('Individual Monthly')).toBeInTheDocument()
      })

      const subscribeButton = screen.getByRole('button', {
        name: 'landing.pricing.getStarted',
      })
      await user.click(subscribeButton)

      await waitFor(() => {
        expect(mockCreateCheckoutSession).toHaveBeenCalled()
      })
    })

    it('redirects team plans to team page', async () => {
      const user = userEvent.setup()
      mockAuthContext.user = createMockUser({
        uid: 'user123',
        email: 'test@example.com',
      })

      renderWithProviders(<PricingSection />)

      await waitFor(() => {
        expect(screen.getByText('Team Monthly')).toBeInTheDocument()
      })

      const teamSubscribeButton = screen.getByRole('button', {
        name: 'landing.pricing.createTeam',
      })
      await user.click(teamSubscribeButton)

      expect(mockLocation.href).toBe('/team?tab=subscription')
    })
  })

  describe('Component Variants', () => {
    beforeEach(() => {
      mockUsePricingPlans.mockReturnValue({
        data: mockPricingPlans,
        isLoading: false,
        isError: false,
        error: null,
      })
    })

    it('hides header when showHeader is false', async () => {
      renderWithProviders(<PricingSection showHeader={false} />)

      await waitFor(() => {
        expect(screen.getByText('Individual Monthly')).toBeInTheDocument()
      })

      expect(
        screen.queryByText('landing.pricing.title'),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText('landing.pricing.landingTitle'),
      ).not.toBeInTheDocument()
    })

    it('hides FAQ when showFAQ is false', async () => {
      renderWithProviders(<PricingSection showFAQ={false} />)

      await waitFor(() => {
        expect(screen.getByText('Individual Monthly')).toBeInTheDocument()
      })

      expect(
        screen.queryByText('landing.pricing.faqTitle'),
      ).not.toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('shows loading state for individual subscription button', async () => {
      const user = userEvent.setup()
      mockUsePricingPlans.mockReturnValue({
        data: mockPricingPlans,
        isLoading: false,
        isError: false,
        error: null,
      })
      mockAuthContext.user = createMockUser({
        uid: 'user123',
        email: 'test@example.com',
      })
      mockCreateCheckoutSession.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      )

      renderWithProviders(<PricingSection />)

      await waitFor(() => {
        expect(screen.getByText('Individual Monthly')).toBeInTheDocument()
      })

      const subscribeButton = screen.getByRole('button', {
        name: 'landing.pricing.getStarted',
      })
      await user.click(subscribeButton)

      await waitFor(() => {
        expect(subscribeButton).toBeDisabled()
        expect(
          screen.getByText('landing.pricing.processing'),
        ).toBeInTheDocument()
      })
    })

    it('shows loading state for team subscription button', async () => {
      const user = userEvent.setup()
      mockUsePricingPlans.mockReturnValue({
        data: mockPricingPlans,
        isLoading: false,
        isError: false,
        error: null,
      })
      mockAuthContext.user = createMockUser({
        uid: 'user123',
        email: 'test@example.com',
      })

      renderWithProviders(<PricingSection />)

      await waitFor(() => {
        expect(screen.getByText('Team Monthly')).toBeInTheDocument()
      })

      const teamSubscribeButton = screen.getByRole('button', {
        name: 'landing.pricing.createTeam',
      })
      await user.click(teamSubscribeButton)

      // Team subscription should redirect immediately, so no loading state
      expect(mockLocation.href).toBe('/team?tab=subscription')
    })
  })

  describe('Error Handling', () => {
    it('handles checkout session creation errors gracefully', async () => {
      const user = userEvent.setup()
      mockUsePricingPlans.mockReturnValue({
        data: mockPricingPlans,
        isLoading: false,
        isError: false,
        error: null,
      })
      mockAuthContext.user = createMockUser({
        uid: 'user123',
        email: 'test@example.com',
      })
      mockCreateCheckoutSession.mockRejectedValue(new Error('Payment failed'))

      renderWithProviders(<PricingSection />)

      await waitFor(() => {
        expect(screen.getByText('Individual Monthly')).toBeInTheDocument()
      })

      const subscribeButton = screen.getByRole('button', {
        name: 'landing.pricing.getStarted',
      })
      await user.click(subscribeButton)

      await waitFor(() => {
        expect(mockCreateCheckoutSession).toHaveBeenCalled()
      })

      // Button should be re-enabled after error
      await waitFor(() => {
        expect(subscribeButton).toBeEnabled()
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUsePricingPlans.mockReturnValue({
        data: mockPricingPlans,
        isLoading: false,
        isError: false,
        error: null,
      })
    })

    it('has proper ARIA labels for billing toggle', async () => {
      renderWithProviders(<PricingSection />)

      await waitFor(() => {
        expect(screen.getByText('Individual Monthly')).toBeInTheDocument()
      })

      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveAttribute('id', 'billing-toggle')

      const labels = screen.getAllByText(
        /landing.pricing.monthly|landing.pricing.yearly/i,
      )
      labels.forEach((label) => {
        expect(label).toHaveAttribute('for', 'billing-toggle')
      })
    })

    it('has proper button roles for subscription actions', async () => {
      renderWithProviders(<PricingSection />)

      await waitFor(() => {
        expect(screen.getByText('Individual Monthly')).toBeInTheDocument()
      })

      const subscribeButtons = [
        screen.getByRole('button', { name: 'landing.pricing.getStarted' }),
        screen.getByRole('button', { name: 'landing.pricing.createTeam' }),
      ]
      subscribeButtons.forEach((button) => {
        expect(button).toBeInTheDocument()
      })
    })
  })
})
