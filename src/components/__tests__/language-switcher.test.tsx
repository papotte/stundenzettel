import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

import LanguageSwitcher from '../language-switcher'

describe('LanguageSwitcher', () => {
  it('renders both language options', () => {
    render(<LanguageSwitcher />)
    // Open the dropdown to render options
    fireEvent.click(screen.getByRole('combobox'))
    expect(
      screen.getAllByText('settings.languageEnglish').length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText('settings.languageGerman').length,
    ).toBeGreaterThan(0)
  })
})
