import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import PricingPage from '../page'

describe('PricingPage', () => {
  it('renders the Pricing page', () => {
    render(<PricingPage />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    expect(screen.getByText('pricing.title')).toBeInTheDocument()
  })
})
