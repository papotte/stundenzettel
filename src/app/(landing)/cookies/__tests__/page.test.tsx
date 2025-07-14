import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import CookiePolicyPage from '../page'

describe('CookiePolicyPage', () => {
  it('renders the Cookie Policy page in English', () => {
    jest
      .spyOn(require('@/context/i18n-context'), 'useTranslation')
      .mockReturnValue({ language: 'en' })
    render(<CookiePolicyPage />)
    expect(screen.getByTestId('cookie-policy-en-article')).toBeInTheDocument()
  })

  it('renders the Cookie Policy page in German', () => {
    jest
      .spyOn(require('@/context/i18n-context'), 'useTranslation')
      .mockReturnValue({ language: 'de' })
    render(<CookiePolicyPage />)
    expect(screen.getByTestId('cookie-policy-de-article')).toBeInTheDocument()
  })
})
