import { render, screen } from '@jest-setup'
import userEvent from '@testing-library/user-event'

import LandingFaqAccordion from '../landing-faq-accordion'

const items = [
  { question: 'Is there a free trial?', answer: 'Yes, 14 days.' },
  { question: 'Can I cancel anytime?', answer: 'Yes, you can.' },
]

let faqItems: { question: string; answer: string }[] = []

jest.mock('next-intl', () => ({
  ...jest.requireActual('next-intl'),
  useMessages: () => ({ landing: { faqs: faqItems } }),
}))

describe('LandingFaqAccordion', () => {
  it('renders each item as an accordion trigger button', () => {
    faqItems = items
    render(<LandingFaqAccordion />)

    const triggers = screen.getAllByRole('button')
    expect(triggers).toHaveLength(2)
    expect(triggers[0]).toHaveTextContent('Is there a free trial?')
    expect(triggers[1]).toHaveTextContent('Can I cancel anytime?')
  })

  it('renders with empty faqs without crashing', () => {
    faqItems = []
    render(<LandingFaqAccordion />)

    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('expands to show answer when a trigger is clicked', async () => {
    faqItems = items
    const user = userEvent.setup()
    render(<LandingFaqAccordion />)

    const trigger = screen.getByRole('button', {
      name: 'Is there a free trial?',
    })
    await user.click(trigger)

    expect(trigger).toHaveAttribute('data-state', 'open')
    expect(screen.getByText('Yes, 14 days.')).toBeInTheDocument()
  })
})
