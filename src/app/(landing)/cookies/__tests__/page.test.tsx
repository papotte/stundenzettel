import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import { useLocale } from 'next-intl'

import CookiePolicyPage from '../page'

// Mock the useLocale hook from next-intl
jest.mock('next-intl', () => ({
  useLocale: jest.fn(),
}))

const mockUseLocale = useLocale as jest.MockedFunction<typeof useLocale>

describe('CookiePolicyPage', () => {
  it('renders the Cookie Policy page in English', () => {
    mockUseLocale.mockReturnValue('en')
    render(<CookiePolicyPage />)
    expect(screen.getByTestId('cookie-policy-en-article')).toBeInTheDocument()
  })

  it('renders the Cookie Policy page in German', () => {
    mockUseLocale.mockReturnValue('de')
    render(<CookiePolicyPage />)
    expect(screen.getByTestId('cookie-policy-de-article')).toBeInTheDocument()
  })
})
