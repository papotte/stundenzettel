import { render, screen } from '@jest-setup'
import '@testing-library/jest-dom'

import type { PricingPlan } from '@/lib/types'

import LandingPage from '../page'

jest.mock('next-intl/server', () => ({
  ...jest.requireActual<typeof import('next-intl/server')>('next-intl/server'),
  getTranslations: jest.fn().mockResolvedValue((key: string) => key),
  getMessages: jest.fn().mockResolvedValue({
    landing: {
      features: { list: { timeTracking: { title: '', desc: '' } } },
      faqs: [
        { question: 'Is there a free trial?', answer: 'Yes, 14 days.' },
      ],
    },
  }),
}))

jest.mock('@/services/stripe/stripe-cached', () => ({
  getCachedPricingPlans: jest.fn(),
}))

const mockPlans: PricingPlan[] = [
  {
    id: 'individual-monthly',
    name: 'Individual Monthly',
    price: 9.99,
    currency: 'EUR',
    interval: 'month',
    features: [],
    stripePriceId: 'price_mock',
  },
]

describe('StartPage', () => {
  beforeEach(async () => {
    const { getCachedPricingPlans } = await import(
      '@/services/stripe/stripe-cached'
    )
    ;(getCachedPricingPlans as jest.Mock).mockResolvedValue(mockPlans)
  })
  it('renders the Landing page', async () => {
    render(await LandingPage())
    expect(
      screen.getByRole('heading', { name: 'landing.heroTitle', level: 1 }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(/start|welcome|zeit|tracker/i).length,
    ).toBeGreaterThanOrEqual(1)
  })

  it('should render the feature section', async () => {
    render(await LandingPage())
    expect(screen.getByText('landing.features.keyFeatures')).toBeInTheDocument()
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
