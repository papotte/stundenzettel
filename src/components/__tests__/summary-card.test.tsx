import React from 'react'

import { render, screen } from '@testing-library/react'

import SummaryCard from '@/components/summary-card'

// Mock translation context
jest.mock('@/context/i18n-context', () => ({
  useTranslation: () => ({
    t: (key: string, params?: { value?: number }) => {
      const dict: Record<string, string> = {
        'tracker.summaryTitle': 'Summary',
        'tracker.summaryDay': 'Day',
        'tracker.summaryWeek': 'Week',
        'tracker.summaryMonth': 'Month',
      }
      if (params && typeof params.value !== 'undefined') {
        return `${dict[key]}: ${params.value}`
      }
      return dict[key] || key
    },
    language: 'en',
    setLanguageState: jest.fn(),
    loading: false,
  }),
}))

jest.mock('@/context/time-tracker-context', () => ({
  useTimeTrackerContext: () => ({
    dailyTotal: 5,
    weeklyTotal: 25,
    monthlyTotal: 100,
  }),
}))

describe('Summary Card', () => {
  it('renders all summary values', () => {
    render(<SummaryCard />)
    expect(screen.getByText('Summary')).toBeInTheDocument()
    expect(screen.getByText('Day')).toBeInTheDocument()
    expect(screen.getByText('0h 5m')).toBeInTheDocument()
    expect(screen.getByText('Week')).toBeInTheDocument()
    expect(screen.getByText('0h 25m')).toBeInTheDocument()
    expect(screen.getByText('Month')).toBeInTheDocument()
    expect(screen.getByText('1h 40m')).toBeInTheDocument()
  })
})
