import { render, screen } from '@jest-setup'
import '@testing-library/jest-dom'

import PrivacyPage from '../page'

describe('PrivacyPage', () => {
  it('renders the Privacy page', () => {
    render(<PrivacyPage />)
    // Check for either language's article
    expect(
      screen.getByTestId('privacy-en-article') ||
        screen.getByTestId('privacy-de-article'),
    ).toBeInTheDocument()
  })
})
