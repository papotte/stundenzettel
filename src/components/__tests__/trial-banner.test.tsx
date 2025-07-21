import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import type { Subscription } from '@/lib/types'
import { subscriptionService } from '@/services/subscription-service'

import TrialBanner from '../trial-banner'

// Mock the subscription service
jest.mock('@/services/subscription-service', () => ({
  subscriptionService: {
    isInTrial: jest.fn(),
    getDaysRemainingInTrial: jest.fn(),
    isTrialExpiringSoon: jest.fn(),
  },
}))

const mockSubscriptionService = subscriptionService as jest.Mocked<
  typeof subscriptionService
>

describe('TrialBanner', () => {
  const createMockSubscription = (
    status: string,
    trialEnd?: Date,
  ): Subscription => ({
    stripeSubscriptionId: 'sub_123',
    stripeCustomerId: 'cus_123',
    status: status as Subscription['status'],
    currentPeriodStart: new Date('2024-01-01'),
    cancelAtPeriodEnd: false,
    priceId: 'price_123',
    planName: 'Test Plan',
    planDescription: 'Test Description',
    quantity: 1,
    updatedAt: new Date('2024-01-01'),
    trialEnd,
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders nothing when user is not in trial', () => {
      mockSubscriptionService.isInTrial.mockReturnValue(false)

      const { container } = render(
        <TrialBanner subscription={createMockSubscription('active')} />,
      )

      expect(container.firstChild).toBeNull()
    })

    it('renders trial banner when user is in trial', () => {
      mockSubscriptionService.isInTrial.mockReturnValue(true)
      mockSubscriptionService.getDaysRemainingInTrial.mockReturnValue(5)
      mockSubscriptionService.isTrialExpiringSoon.mockReturnValue(false)

      render(<TrialBanner subscription={createMockSubscription('trialing')} />)

      expect(screen.getByTestId('trial-banner')).toBeInTheDocument()
      expect(screen.getByTestId('trial-banner-title')).toHaveTextContent(
        'subscription.trialBannerTitle',
      )
      expect(
        screen.getByTestId('trial-banner-days-remaining'),
      ).toHaveTextContent('subscription.trialBannerDaysRemaining')
    })

    it('shows trial badge', () => {
      mockSubscriptionService.isInTrial.mockReturnValue(true)
      mockSubscriptionService.getDaysRemainingInTrial.mockReturnValue(5)
      mockSubscriptionService.isTrialExpiringSoon.mockReturnValue(false)

      render(<TrialBanner subscription={createMockSubscription('trialing')} />)

      expect(screen.getByTestId('trial-banner-badge')).toHaveTextContent(
        'subscription.trial',
      )
    })

    it('shows manage trial button', () => {
      mockSubscriptionService.isInTrial.mockReturnValue(true)
      mockSubscriptionService.getDaysRemainingInTrial.mockReturnValue(5)
      mockSubscriptionService.isTrialExpiringSoon.mockReturnValue(false)

      render(<TrialBanner subscription={createMockSubscription('trialing')} />)

      expect(
        screen.getByTestId('trial-banner-manage-button'),
      ).toHaveTextContent('subscription.manageTrial')
    })

    it('shows clock icon', () => {
      mockSubscriptionService.isInTrial.mockReturnValue(true)
      mockSubscriptionService.getDaysRemainingInTrial.mockReturnValue(5)
      mockSubscriptionService.isTrialExpiringSoon.mockReturnValue(false)

      render(<TrialBanner subscription={createMockSubscription('trialing')} />)

      expect(screen.getByTestId('trial-banner-clock-icon')).toBeInTheDocument()
    })
  })

  describe('Trial Countdown', () => {
    it('shows days remaining when trial has more than 0 days', () => {
      mockSubscriptionService.isInTrial.mockReturnValue(true)
      mockSubscriptionService.getDaysRemainingInTrial.mockReturnValue(7)
      mockSubscriptionService.isTrialExpiringSoon.mockReturnValue(false)

      render(<TrialBanner subscription={createMockSubscription('trialing')} />)

      expect(
        screen.getByTestId('trial-banner-days-remaining'),
      ).toHaveTextContent('subscription.trialBannerDaysRemaining')
    })

    it('shows "ends today" when trial has 0 days remaining', () => {
      mockSubscriptionService.isInTrial.mockReturnValue(true)
      mockSubscriptionService.getDaysRemainingInTrial.mockReturnValue(0)
      mockSubscriptionService.isTrialExpiringSoon.mockReturnValue(false)

      render(<TrialBanner subscription={createMockSubscription('trialing')} />)

      expect(
        screen.getByTestId('trial-banner-days-remaining'),
      ).toHaveTextContent('subscription.trialBannerEndsToday')
    })

    it('shows "ends today" when trial has negative days remaining', () => {
      mockSubscriptionService.isInTrial.mockReturnValue(true)
      mockSubscriptionService.getDaysRemainingInTrial.mockReturnValue(-1)
      mockSubscriptionService.isTrialExpiringSoon.mockReturnValue(false)

      render(<TrialBanner subscription={createMockSubscription('trialing')} />)

      expect(
        screen.getByTestId('trial-banner-days-remaining'),
      ).toHaveTextContent('subscription.trialBannerEndsToday')
    })

    it('handles null days remaining', () => {
      mockSubscriptionService.isInTrial.mockReturnValue(true)
      mockSubscriptionService.getDaysRemainingInTrial.mockReturnValue(null)
      mockSubscriptionService.isTrialExpiringSoon.mockReturnValue(false)

      render(<TrialBanner subscription={createMockSubscription('trialing')} />)

      expect(
        screen.getByTestId('trial-banner-days-remaining'),
      ).toHaveTextContent('subscription.trialBannerEndsToday')
    })
  })

  describe('Trial Expiration Warning', () => {
    it('shows warning icon when trial is expiring soon', () => {
      mockSubscriptionService.isInTrial.mockReturnValue(true)
      mockSubscriptionService.getDaysRemainingInTrial.mockReturnValue(2)
      mockSubscriptionService.isTrialExpiringSoon.mockReturnValue(true)

      render(<TrialBanner subscription={createMockSubscription('trialing')} />)

      expect(
        screen.getByTestId('trial-banner-warning-icon'),
      ).toBeInTheDocument()
    })

    it('does not show warning icon when trial is not expiring soon', () => {
      mockSubscriptionService.isInTrial.mockReturnValue(true)
      mockSubscriptionService.getDaysRemainingInTrial.mockReturnValue(10)
      mockSubscriptionService.isTrialExpiringSoon.mockReturnValue(false)

      render(<TrialBanner subscription={createMockSubscription('trialing')} />)

      expect(
        screen.queryByTestId('trial-banner-warning-icon'),
      ).not.toBeInTheDocument()
    })
  })

  describe('Manage Trial Button', () => {
    it('navigates to subscription page when clicked (default behavior)', () => {
      mockSubscriptionService.isInTrial.mockReturnValue(true)
      mockSubscriptionService.getDaysRemainingInTrial.mockReturnValue(5)
      mockSubscriptionService.isTrialExpiringSoon.mockReturnValue(false)

      // Mock window.location.href
      const originalLocation = window.location
      const mockLocation = { ...originalLocation, href: '' }
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      })

      render(<TrialBanner subscription={createMockSubscription('trialing')} />)

      fireEvent.click(screen.getByTestId('trial-banner-manage-button'))

      expect(window.location.href).toBe('/subscription')

      // Restore original location
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      })
    })

    it('calls custom onManageTrial handler when provided', () => {
      mockSubscriptionService.isInTrial.mockReturnValue(true)
      mockSubscriptionService.getDaysRemainingInTrial.mockReturnValue(5)
      mockSubscriptionService.isTrialExpiringSoon.mockReturnValue(false)

      const mockOnManageTrial = jest.fn()

      render(
        <TrialBanner
          subscription={createMockSubscription('trialing')}
          onManageTrial={mockOnManageTrial}
        />,
      )

      fireEvent.click(screen.getByTestId('trial-banner-manage-button'))

      expect(mockOnManageTrial).toHaveBeenCalledTimes(1)
    })
  })

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      mockSubscriptionService.isInTrial.mockReturnValue(true)
      mockSubscriptionService.getDaysRemainingInTrial.mockReturnValue(5)
      mockSubscriptionService.isTrialExpiringSoon.mockReturnValue(false)

      render(
        <TrialBanner
          subscription={createMockSubscription('trialing')}
          className="custom-class"
        />,
      )

      const banner = screen.getByTestId('trial-banner')
      expect(banner).toHaveClass('custom-class')
    })
  })

  describe('Edge Cases', () => {
    it('handles null subscription gracefully', () => {
      mockSubscriptionService.isInTrial.mockReturnValue(false)

      const { container } = render(<TrialBanner subscription={null} />)

      expect(container.firstChild).toBeNull()
    })

    it('handles subscription with non-trialing status', () => {
      mockSubscriptionService.isInTrial.mockReturnValue(false)

      const { container } = render(
        <TrialBanner subscription={createMockSubscription('active')} />,
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Accessibility', () => {
    it('has proper test IDs for all interactive elements', () => {
      mockSubscriptionService.isInTrial.mockReturnValue(true)
      mockSubscriptionService.getDaysRemainingInTrial.mockReturnValue(5)
      mockSubscriptionService.isTrialExpiringSoon.mockReturnValue(false)

      render(<TrialBanner subscription={createMockSubscription('trialing')} />)

      expect(screen.getByTestId('trial-banner')).toBeInTheDocument()
      expect(screen.getByTestId('trial-banner-title')).toBeInTheDocument()
      expect(
        screen.getByTestId('trial-banner-days-remaining'),
      ).toBeInTheDocument()
      expect(screen.getByTestId('trial-banner-badge')).toBeInTheDocument()
      expect(
        screen.getByTestId('trial-banner-manage-button'),
      ).toBeInTheDocument()
      expect(screen.getByTestId('trial-banner-clock-icon')).toBeInTheDocument()
    })

    it('has proper button role for manage trial button', () => {
      mockSubscriptionService.isInTrial.mockReturnValue(true)
      mockSubscriptionService.getDaysRemainingInTrial.mockReturnValue(5)
      mockSubscriptionService.isTrialExpiringSoon.mockReturnValue(false)

      render(<TrialBanner subscription={createMockSubscription('trialing')} />)

      const manageButton = screen.getByTestId('trial-banner-manage-button')
      // Button elements have implicit button role, so we check for the button element
      expect(manageButton.tagName).toBe('BUTTON')
    })
  })
})
