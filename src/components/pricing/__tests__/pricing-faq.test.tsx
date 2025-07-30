import React from 'react'

import { render, screen } from '@testing-library/react'

import PricingFAQ from '../pricing-faq'

describe('PricingFAQ', () => {
  it('renders the FAQ title', () => {
    render(<PricingFAQ />)

    expect(screen.getByText('landing.pricing.faqTitle')).toBeInTheDocument()
  })

  it('renders all FAQ questions', () => {
    render(<PricingFAQ />)

    expect(screen.getByText('landing.pricing.faq1Question')).toBeInTheDocument()
    expect(screen.getByText('landing.pricing.faq2Question')).toBeInTheDocument()
    expect(screen.getByText('landing.pricing.faq3Question')).toBeInTheDocument()
    expect(screen.getByText('landing.pricing.faq4Question')).toBeInTheDocument()
  })

  it('renders all FAQ answers', () => {
    render(<PricingFAQ />)

    expect(screen.getByText('landing.pricing.faq1Answer')).toBeInTheDocument()
    expect(screen.getByText('landing.pricing.faq2Answer')).toBeInTheDocument()
    expect(screen.getByText('landing.pricing.faq3Answer')).toBeInTheDocument()
    expect(screen.getByText('landing.pricing.faq4Answer')).toBeInTheDocument()
  })

  it('has correct heading structure', () => {
    render(<PricingFAQ />)

    const mainHeading = screen.getByRole('heading', { level: 3 })
    expect(mainHeading).toHaveTextContent('landing.pricing.faqTitle')

    const questionHeadings = screen.getAllByRole('heading', { level: 4 })
    expect(questionHeadings).toHaveLength(4)
    expect(questionHeadings[0]).toHaveTextContent(
      'landing.pricing.faq1Question',
    )
    expect(questionHeadings[1]).toHaveTextContent(
      'landing.pricing.faq2Question',
    )
    expect(questionHeadings[2]).toHaveTextContent(
      'landing.pricing.faq3Question',
    )
    expect(questionHeadings[3]).toHaveTextContent(
      'landing.pricing.faq4Question',
    )
  })

  it('applies correct styling classes', () => {
    render(<PricingFAQ />)

    const container = screen
      .getByText('landing.pricing.faqTitle')
      .closest('div')
    expect(container).toHaveClass('mt-16', 'text-center')

    const gridContainer = container?.querySelector('.grid')
    expect(gridContainer).toHaveClass(
      'grid-cols-1',
      'md:grid-cols-2',
      'gap-8',
      'max-w-4xl',
      'mx-auto',
    )
  })
})
