import React from 'react'
import { render, screen } from '@testing-library/react'
import TimesheetHeader from '../timesheet-header'
import type { UserSettings } from '@/lib/types'
import { dictionaries } from '@/lib/i18n/dictionaries'

// Helper to resolve nested keys from the dictionary
const getNestedValue = (obj: any, key: string): string => {
  return key.split('.').reduce((acc, part) => acc && acc[part], obj) || key
}

// Mock t function using the actual dictionary
const t = (key: string, replacements?: Record<string, string | number>) => {
  let value = getNestedValue(dictionaries.en, key)
  if (replacements) {
    Object.keys(replacements).forEach((placeholder) => {
      value = value.replace(
        `{${placeholder}}`,
        String(replacements[placeholder]),
      )
    })
  }
  return value
}

describe('TimesheetHeader', () => {
  it('renders nothing when user settings are not provided', () => {
    const { container } = render(<TimesheetHeader userSettings={null} t={t} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when company details in user settings are empty', () => {
    const userSettings: UserSettings = {
      defaultWorkHours: 8,
      defaultStartTime: '09:00',
      defaultEndTime: '17:00',
      language: 'en',
    }
    const { container } = render(
      <TimesheetHeader userSettings={userSettings} t={t} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders company name and details when provided', () => {
    const userSettings: UserSettings = {
      companyName: 'Test Corp',
      companyEmail: 'test@corp.com',
      companyPhone1: '123-456',
      companyPhone2: '789-012',
      companyFax: '345-678',
      defaultWorkHours: 8,
      defaultStartTime: '09:00',
      defaultEndTime: '17:00',
      language: 'en',
    }

    render(<TimesheetHeader userSettings={userSettings} t={t} />)

    expect(screen.getByText('Name and Phone / Radio:')).toBeInTheDocument()
    const details = screen.getByText(/Test Corp/)
    expect(details).toHaveTextContent('test@corp.com')
    expect(details).toHaveTextContent('Tel.: 123-456 / 789-012')
    expect(details).toHaveTextContent('FAX: 345-678')
  })

  it('handles partial user settings gracefully', () => {
    const userSettings: UserSettings = {
      companyName: 'Partial Inc.',
      defaultWorkHours: 8,
      defaultStartTime: '09:00',
      defaultEndTime: '17:00',
      language: 'en',
      companyEmail: '',
      companyPhone1: '123-456',
      companyPhone2: '',
      companyFax: '',
    }

    render(<TimesheetHeader userSettings={userSettings} t={t} />)

    expect(screen.getByText('Name and Phone / Radio:')).toBeInTheDocument()
    const details = screen.getByText(/Partial Inc./)
    expect(details).toHaveTextContent('Tel.: 123-456')
    expect(screen.queryByText(/test@corp.com/)).not.toBeInTheDocument()
    expect(screen.queryByText(/FAX:/)).not.toBeInTheDocument()
  })
})
