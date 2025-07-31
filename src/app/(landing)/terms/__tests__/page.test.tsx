import { render, screen } from '@jest-setup'
import '@testing-library/jest-dom'

import TermsPage from '../page'

describe('TermsPage', () => {
  it('renders the Terms page', () => {
    render(<TermsPage />)
    // Check for either language's article
    expect(
      screen.getByTestId('terms-en-article') ||
        screen.getByTestId('terms-de-article'),
    ).toBeInTheDocument()
  })
})
