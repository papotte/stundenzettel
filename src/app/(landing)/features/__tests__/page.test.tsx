import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import FeaturesPage from '../page'

describe('FeaturesPage', () => {
  it('renders the Features page', () => {
    render(<FeaturesPage />)
    let found = false
    try {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      found = true
    } catch {}
    if (!found) {
      expect(
        screen.getByText('landing.features.headerTitle'),
      ).toBeInTheDocument()
    }
  })
})
