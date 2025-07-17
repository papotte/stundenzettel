import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import type { PricingPlan } from '@/lib/types'

import PricingCard from '../pricing/pricing-card'

describe('PricingCard', () => {
  const mockOnSubscribe = jest.fn()
  const mockOnTeamSubscribe = jest.fn()

  const basePlan: PricingPlan = {
    id: 'basic',
    name: 'Basic Plan',
    price: 9.99,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: 'price_basic_monthly',
    features: ['Basic feature 1', 'Basic feature 2'],
    maxUsers: undefined,
    tieredPricing: undefined,
  }

  const popularPlan: PricingPlan = {
    id: 'pro',
    name: 'Pro Plan',
    price: 19.99,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: 'price_pro_monthly',
    features: ['Pro feature 1', 'Priority support', 'Pro feature 3'],
    maxUsers: undefined,
    tieredPricing: undefined,
  }

  const teamPlan: PricingPlan = {
    id: 'team',
    name: 'Team Plan',
    price: 29.99,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: 'price_team_monthly',
    features: ['Team feature 1', 'Team collaboration', 'Team feature 3'],
    maxUsers: 10,
    tieredPricing: undefined,
  }

  const tieredPlan: PricingPlan = {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: 49.99,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: 'price_enterprise_monthly',
    features: ['Enterprise feature 1', 'Enterprise feature 2'],
    maxUsers: undefined,
    tieredPricing: {
      tiers: [
        { from: 1, to: 9, price: 49.99, currency: 'EUR' },
        { from: 10, to: 49, price: 39.99, currency: 'EUR' },
        { from: 50, price: 29.99, currency: 'EUR' },
      ],
      displayText: 'Price shown is for 10+ users',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders basic plan correctly', () => {
    render(
      <PricingCard
        plan={basePlan}
        loading={null}
        onSubscribe={mockOnSubscribe}
        onTeamSubscribe={mockOnTeamSubscribe}
      />,
    )

    expect(screen.getByText('Basic Plan')).toBeInTheDocument()
    expect(screen.getByText('€9.99')).toBeInTheDocument()
    expect(screen.getByText(/pricing\.month/)).toBeInTheDocument()
    expect(screen.getByText('Basic feature 1')).toBeInTheDocument()
    expect(screen.getByText('Basic feature 2')).toBeInTheDocument()
    expect(screen.getByText('pricing.getStarted')).toBeInTheDocument()
  })

  it('renders yearly pricing correctly', () => {
    const yearlyPlan = { ...basePlan, interval: 'year' as const }
    render(
      <PricingCard
        plan={yearlyPlan}
        loading={null}
        onSubscribe={mockOnSubscribe}
        onTeamSubscribe={mockOnTeamSubscribe}
      />,
    )

    expect(screen.getByText(/pricing\.year/)).toBeInTheDocument()
  })

  it('shows most popular badge for plans with priority support', () => {
    render(
      <PricingCard
        plan={popularPlan}
        loading={null}
        onSubscribe={mockOnSubscribe}
        onTeamSubscribe={mockOnTeamSubscribe}
      />,
    )

    expect(screen.getByText('pricing.mostPopular')).toBeInTheDocument()
  })

  it('applies special styling to popular plans', () => {
    render(
      <PricingCard
        plan={popularPlan}
        loading={null}
        onSubscribe={mockOnSubscribe}
        onTeamSubscribe={mockOnTeamSubscribe}
      />,
    )

    const card = screen.getByText('Pro Plan').closest('.border-2')
    expect(card).toHaveClass('border-primary', 'shadow-lg', 'scale-105')
  })

  it('renders team plan with create team button', () => {
    render(
      <PricingCard
        plan={teamPlan}
        loading={null}
        onSubscribe={mockOnSubscribe}
        onTeamSubscribe={mockOnTeamSubscribe}
      />,
    )

    expect(screen.getByText('pricing.createTeam')).toBeInTheDocument()
  })

  it('calls onSubscribe for individual plans', () => {
    render(
      <PricingCard
        plan={basePlan}
        loading={null}
        onSubscribe={mockOnSubscribe}
        onTeamSubscribe={mockOnTeamSubscribe}
      />,
    )

    const button = screen.getByText('pricing.getStarted')
    fireEvent.click(button)

    expect(mockOnSubscribe).toHaveBeenCalledWith(basePlan)
    expect(mockOnTeamSubscribe).not.toHaveBeenCalled()
  })

  it('calls onTeamSubscribe for team plans', () => {
    render(
      <PricingCard
        plan={teamPlan}
        loading={null}
        onSubscribe={mockOnSubscribe}
        onTeamSubscribe={mockOnTeamSubscribe}
      />,
    )

    const button = screen.getByText('pricing.createTeam')
    fireEvent.click(button)

    expect(mockOnTeamSubscribe).toHaveBeenCalledWith(teamPlan)
    expect(mockOnSubscribe).not.toHaveBeenCalled()
  })

  it('shows loading state when plan is loading', () => {
    render(
      <PricingCard
        plan={basePlan}
        loading="basic"
        onSubscribe={mockOnSubscribe}
        onTeamSubscribe={mockOnTeamSubscribe}
      />,
    )

    expect(screen.getByText('pricing.processing')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renders tiered pricing correctly', () => {
    render(
      <PricingCard
        plan={tieredPlan}
        loading={null}
        onSubscribe={mockOnSubscribe}
        onTeamSubscribe={mockOnTeamSubscribe}
      />,
    )

    expect(screen.getByText('Starting at')).toBeInTheDocument()
    expect(screen.getByText('€29.99')).toBeInTheDocument() // Min price from tiers
    expect(screen.getByText('Price shown is for 10+ users')).toBeInTheDocument()
  })

  it('renders correct feature icons', () => {
    render(
      <PricingCard
        plan={popularPlan}
        loading={null}
        onSubscribe={mockOnSubscribe}
        onTeamSubscribe={mockOnTeamSubscribe}
      />,
    )

    // Check that features are rendered
    expect(screen.getByText('Pro feature 1')).toBeInTheDocument()
    expect(screen.getByText('Priority support')).toBeInTheDocument()
    expect(screen.getByText('Pro feature 3')).toBeInTheDocument()
  })

  it('applies correct button styling for popular plans', () => {
    render(
      <PricingCard
        plan={popularPlan}
        loading={null}
        onSubscribe={mockOnSubscribe}
        onTeamSubscribe={mockOnTeamSubscribe}
      />,
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary', 'hover:bg-primary/90')
  })

  it('applies correct button styling for regular plans', () => {
    render(
      <PricingCard
        plan={basePlan}
        loading={null}
        onSubscribe={mockOnSubscribe}
        onTeamSubscribe={mockOnTeamSubscribe}
      />,
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gray-900', 'hover:bg-gray-800')
  })
})
