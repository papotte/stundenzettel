import React from 'react'

import { render, screen } from '@jest-setup'

import SummaryCard from '@/components/summary-card'

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
    expect(screen.getByText('tracker.summaryTitle')).toBeInTheDocument()
    expect(screen.getByText('0h 5m')).toBeInTheDocument()
    expect(screen.getByText('tracker.summaryWeek')).toBeInTheDocument()
    expect(screen.getByText('0h 25m')).toBeInTheDocument()
    expect(screen.getByText('tracker.summaryMonth')).toBeInTheDocument()
    expect(screen.getByText('1h 40m')).toBeInTheDocument()
  })
})
