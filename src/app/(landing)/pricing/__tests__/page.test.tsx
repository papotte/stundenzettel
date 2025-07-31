import { render, screen } from '@jest-setup'
import '@testing-library/jest-dom'

import PricingPage from '../page'

describe('PricingPage', () => {
  it('renders the Pricing page', () => {
    render(<PricingPage />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    expect(screen.getByText('landing.pricing.title')).toBeInTheDocument()
  })
})
