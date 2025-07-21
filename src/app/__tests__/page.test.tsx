import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import LandingPage from '../page'

describe('StartPage', () => {
  it('renders the Landing page', () => {
    render(<LandingPage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/start|welcome|zeit|tracker/i)).toBeInTheDocument()
  })

  it('should render the feature section', () => {
    render(<LandingPage />)
    expect(screen.getByText('landing.features.keyFeatures')).toBeInTheDocument()
  })

  it('should render the pricing section', () => {
    render(<LandingPage />)
    expect(screen.getByText('landing.pricing.headerTitle')).toBeInTheDocument()
  })

  it('should render the FAQ section', () => {
    render(<LandingPage />)
    expect(screen.getByText('landing.faqTitle')).toBeInTheDocument()
  })

  it('should render the footer', () => {
    render(<LandingPage />)
    expect(screen.getByTestId('footer')).toBeInTheDocument()
    expect(screen.getByText('landing.footer.copyright')).toBeInTheDocument()
  })
})
