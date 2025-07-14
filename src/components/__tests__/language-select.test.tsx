import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

import LanguageSelect from '../language-select'

describe('LanguageSelect', () => {
  it('renders both language options', () => {
    render(<LanguageSelect value="en" onChange={() => {}} />)
    // Open the dropdown to render options
    fireEvent.click(screen.getByRole('combobox'))
    expect(
      screen.getAllByText('settings.languageEnglish').length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText('settings.languageGerman').length,
    ).toBeGreaterThan(0)
  })

  it('calls onChange when a language is selected', () => {
    const onChange = jest.fn()
    render(<LanguageSelect value="en" onChange={onChange} />)
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('settings.languageGerman'))
    expect(onChange).toHaveBeenCalledWith('de')
  })
})
