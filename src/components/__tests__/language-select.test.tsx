import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

import LanguageSelect from '../language-select'

describe('LanguageSelect', () => {
  it('renders both language options', () => {
    render(<LanguageSelect value="en" onChange={() => {}} />)
    // Open the dropdown to render options
    fireEvent.click(screen.getByRole('combobox'))
    expect(screen.getAllByText('settings.languageEn').length).toBeGreaterThan(0)
    expect(screen.getAllByText('settings.languageDe').length).toBeGreaterThan(0)
  })

  it('calls onChange when a language is selected', () => {
    const onChange = jest.fn()
    render(<LanguageSelect value="en" onChange={onChange} />)
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('settings.languageDe'))
    expect(onChange).toHaveBeenCalledWith('de')
  })
})
