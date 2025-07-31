import { render, screen } from '@jest-setup'
import '@testing-library/jest-dom'

import ImprintPage from '../page'

describe('ImprintPage', () => {
  it('renders the Imprint page', () => {
    render(<ImprintPage />)
    // Check for either language's article
    expect(
      screen.getByTestId('imprint-en-article') ||
        screen.getByTestId('imprint-de-article'),
    ).toBeInTheDocument()
  })
})
