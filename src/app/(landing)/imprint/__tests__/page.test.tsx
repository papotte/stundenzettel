import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import ImprintPage from '../page'

describe('ImprintPage', () => {
  it('renders the Imprint page', () => {
    render(<ImprintPage />)
    // Check for either language's article
    expect(
      screen.getByTestId('imprint-en-article') || screen.getByTestId('imprint-de-article')
    ).toBeInTheDocument()
  })
})
