import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import PricingPage from '../page'

describe('PricingPage', () => {
  it('renders the Pricing page', () => {
    render(<PricingPage />)
    let found = false
    try {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      found = true
    } catch {}
    if (!found) {
      expect(screen.getByText('pricing.title')).toBeInTheDocument()
    }
  })
})
