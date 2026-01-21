import { render, screen } from '@jest-setup'
import '@testing-library/jest-dom'

import LandingPage from '../page'

jest.mock('next-intl/server', () => ({
  ...jest.requireActual<typeof import('next-intl/server')>('next-intl/server'),
  getTranslations: jest.fn().mockResolvedValue((key: string) => key),
}))

describe('StartPage', () => {
  it('renders the Landing page', async () => {
    render(await LandingPage())
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText('landing.heroTitle')).toBeInTheDocument()
  })

  it('should render the feature section', async () => {
    render(await LandingPage())
    expect(screen.getByText('Key Features')).toBeInTheDocument()
  })

  it('should render the pricing section', async () => {
    render(await LandingPage())
    expect(screen.getByText('landing.pricing.landingTitle')).toBeInTheDocument()
  })

  it('should render the FAQ section', async () => {
    render(await LandingPage())
    expect(screen.getByText('landing.faqTitle')).toBeInTheDocument()
  })

  it('should render the footer', async () => {
    render(await LandingPage())
    expect(screen.getByTestId('footer')).toBeInTheDocument()
    expect(screen.getByText('landing.footer.copyright')).toBeInTheDocument()
  })
})
