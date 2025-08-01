import { fireEvent, render, screen } from '@jest-setup'
import '@testing-library/jest-dom'

import LanguageSwitcher from '../language-switcher'

describe('LanguageSwitcher', () => {
  it('renders both language options', () => {
    render(<LanguageSwitcher />)
    // Open the dropdown to render options
    fireEvent.click(screen.getByRole('combobox'))
    expect(screen.getAllByText('settings.languageEn').length).toBeGreaterThan(0)
    expect(screen.getAllByText('settings.languageDe').length).toBeGreaterThan(0)
  })
})
