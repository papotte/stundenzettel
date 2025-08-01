import { render, screen } from '@jest-setup'
import '@testing-library/jest-dom'

import FeaturesPage from '../page'

describe('FeaturesPage', () => {
  it('renders the Features page', () => {
    render(<FeaturesPage />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    expect(screen.getByText('landing.features.headerTitle')).toBeInTheDocument()
  })
})
