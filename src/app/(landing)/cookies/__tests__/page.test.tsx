import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import CookiePolicyPage from '../page'

let mockLanguage = 'en'
jest.mock('@/context/i18n-context', () => ({
  useTranslation: () => ({ language: mockLanguage }),
}))

describe('CookiePolicyPage', () => {
  afterEach(() => {
    mockLanguage = 'en'
  })

  it('renders the Cookie Policy page in English', () => {
    mockLanguage = 'en'
    render(<CookiePolicyPage />)
    expect(screen.getByTestId('cookie-policy-en-article')).toBeInTheDocument()
  })

  it('renders the Cookie Policy page in German', () => {
    mockLanguage = 'de'
    render(<CookiePolicyPage />)
    expect(screen.getByTestId('cookie-policy-de-article')).toBeInTheDocument()
  })
})
