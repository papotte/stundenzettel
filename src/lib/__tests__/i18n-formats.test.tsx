import React from 'react'

import { render, renderWithGermanLocale } from '@jest-setup'
import '@testing-library/jest-dom'
import { screen } from '@testing-library/react'

import { useFormatter } from 'next-intl'

// Test component that uses the formatter
function FormatTestComponent({ testDate }: { testDate: Date }) {
  const format = useFormatter()

  return (
    <div data-testid="format-test">
      <div data-testid="long">{format.dateTime(testDate, 'long')}</div>
      <div data-testid="short">{format.dateTime(testDate, 'short')}</div>
      <div data-testid="shortTime">
        {format.dateTime(testDate, 'shortTime')}
      </div>
      <div data-testid="month">{format.dateTime(testDate, 'month')}</div>
      <div data-testid="monthYear">
        {format.dateTime(testDate, 'monthYear')}
      </div>
      <div data-testid="yearMonth">
        {format.dateTime(testDate, 'yearMonth')}
      </div>
      <div data-testid="weekday">{format.dateTime(testDate, 'weekday')}</div>
    </div>
  )
}

// Test component for number and currency formatting
function NumberFormatTestComponent() {
  const format = useFormatter()

  return (
    <div data-testid="number-format-test">
      <div data-testid="decimal">{format.number(1234.56, 'decimal')}</div>
      <div data-testid="percent">{format.number(0.1234, 'percent')}</div>
      <div data-testid="currencyEUR">
        {format.number(1234.56, 'currency', { currency: 'EUR' })}
      </div>
      <div data-testid="currencyUSD">
        {format.number(1234.56, 'currency', { currency: 'USD' })}
      </div>
      <div data-testid="integer">{format.number(1234.56, 'integer')}</div>
      <div data-testid="negative">{format.number(-1234.56, 'currency')}</div>
      <div data-testid="zero">{format.number(0, 'currency')}</div>
      <div data-testid="large">{format.number(1234567.89, 'currency')}</div>
    </div>
  )
}

describe('i18n dateTime formats', () => {
  const testDate = new Date('2024-01-15T14:30:00') // Monday, January 15, 2024 at 2:30 PM

  describe('English formatting', () => {
    beforeEach(() => {
      render(<FormatTestComponent testDate={testDate} />)
    })

    it('should format date with long format', () => {
      expect(screen.getByTestId('long')).toHaveTextContent(
        'Monday, January 15, 2024',
      )
    })

    it('should format date with short format', () => {
      expect(screen.getByTestId('short')).toHaveTextContent('1/15/2024')
    })

    it('should format time with shortTime format', () => {
      expect(screen.getByTestId('shortTime')).toHaveTextContent('14:30')
    })

    it('should format with month format', () => {
      expect(screen.getByTestId('month')).toHaveTextContent('January')
    })

    it('should format with monthYear format', () => {
      expect(screen.getByTestId('monthYear')).toHaveTextContent('January 2024')
    })

    it('should format with yearMonth format', () => {
      expect(screen.getByTestId('yearMonth')).toHaveTextContent('1/2024')
    })

    it('should format with weekday format', () => {
      expect(screen.getByTestId('weekday')).toHaveTextContent('Mon')
    })
  })

  describe('German formatting', () => {
    beforeEach(() => {
      renderWithGermanLocale(<FormatTestComponent testDate={testDate} />)
    })

    it('should format date with long format', () => {
      expect(screen.getByTestId('long')).toHaveTextContent(
        'Montag, 15. Januar 2024',
      )
    })

    it('should format date with short format', () => {
      expect(screen.getByTestId('short')).toHaveTextContent('15.1.2024')
    })

    it('should format time with shortTime format', () => {
      expect(screen.getByTestId('shortTime')).toHaveTextContent('14:30')
    })

    it('should format with month format', () => {
      expect(screen.getByTestId('month')).toHaveTextContent('Januar')
    })

    it('should format with monthYear format', () => {
      expect(screen.getByTestId('monthYear')).toHaveTextContent('Januar 2024')
    })

    it('should format with yearMonth format', () => {
      expect(screen.getByTestId('yearMonth')).toHaveTextContent('1/2024')
    })

    it('should format with weekday format', () => {
      expect(screen.getByTestId('weekday')).toHaveTextContent('Mo')
    })
  })

  describe('Edge cases', () => {
    it('should handle different times of day correctly', () => {
      const morning = new Date('2024-01-15T09:15:00')
      const evening = new Date('2024-01-15T23:45:00')

      function TimeTestComponent() {
        const format = useFormatter()
        return (
          <div>
            <div data-testid="morning">
              {format.dateTime(morning, 'shortTime')}
            </div>
            <div data-testid="evening">
              {format.dateTime(evening, 'shortTime')}
            </div>
          </div>
        )
      }

      render(<TimeTestComponent />)

      expect(screen.getByTestId('morning')).toHaveTextContent('09:15')
      expect(screen.getByTestId('evening')).toHaveTextContent('23:45')
    })

    it('should handle different months correctly', () => {
      const december = new Date('2024-12-25T12:00:00Z')
      const july = new Date('2024-07-04T12:00:00Z')

      function MonthTestComponent() {
        const format = useFormatter()
        return (
          <div>
            <div data-testid="december">
              {format.dateTime(december, 'month')}
            </div>
            <div data-testid="july">{format.dateTime(july, 'month')}</div>
          </div>
        )
      }

      render(<MonthTestComponent />)

      expect(screen.getByTestId('december')).toHaveTextContent('December')
      expect(screen.getByTestId('july')).toHaveTextContent('July')
    })

    it('should handle different weekdays correctly', () => {
      const sunday = new Date('2024-01-14T12:00:00Z') // Sunday
      const friday = new Date('2024-01-19T12:00:00Z') // Friday

      function WeekdayTestComponent() {
        const format = useFormatter()
        return (
          <div>
            <div data-testid="sunday">{format.dateTime(sunday, 'weekday')}</div>
            <div data-testid="friday">{format.dateTime(friday, 'weekday')}</div>
          </div>
        )
      }

      render(<WeekdayTestComponent />)

      expect(screen.getByTestId('sunday')).toHaveTextContent('Sun')
      expect(screen.getByTestId('friday')).toHaveTextContent('Fri')
    })
  })
})

describe('i18n number and currency formats', () => {
  describe('English number formatting', () => {
    beforeEach(() => {
      render(<NumberFormatTestComponent />)
    })

    it('should format decimal numbers', () => {
      expect(screen.getByTestId('decimal')).toHaveTextContent('1,234.56')
    })

    it('should format percentages', () => {
      expect(screen.getByTestId('percent')).toHaveTextContent('12.3%')
    })

    it('should format EUR currency', () => {
      expect(screen.getByTestId('currencyEUR')).toHaveTextContent('€1,234.56')
    })

    it('should format USD currency', () => {
      expect(screen.getByTestId('currencyUSD')).toHaveTextContent('$1,234.56')
    })

    it('should format integers', () => {
      expect(screen.getByTestId('integer')).toHaveTextContent('1,235')
    })

    it('should format negative currency values', () => {
      expect(screen.getByTestId('negative')).toHaveTextContent('-€1,234.56')
    })

    it('should format zero currency values', () => {
      expect(screen.getByTestId('zero')).toHaveTextContent('€0')
    })

    it('should format large currency values', () => {
      expect(screen.getByTestId('large')).toHaveTextContent('€1,234,567.89')
    })
  })

  describe('German number formatting', () => {
    beforeEach(() => {
      renderWithGermanLocale(<NumberFormatTestComponent />)
    })

    it('should format decimal numbers with German locale', () => {
      expect(screen.getByTestId('decimal')).toHaveTextContent('1.234,56')
    })

    it('should format percentages with German locale', () => {
      expect(screen.getByTestId('percent')).toHaveTextContent('12,3 %')
    })

    it('should format EUR currency with German locale', () => {
      expect(screen.getByTestId('currencyEUR')).toHaveTextContent('1.234,56 €')
    })

    it('should format USD currency with German locale', () => {
      expect(screen.getByTestId('currencyUSD')).toHaveTextContent('1.234,56 $')
    })

    it('should format integers with German locale', () => {
      expect(screen.getByTestId('integer')).toHaveTextContent('1.235')
    })

    it('should format negative currency values with German locale', () => {
      expect(screen.getByTestId('negative')).toHaveTextContent('-1.234,56 €')
    })

    it('should format zero currency values with German locale', () => {
      expect(screen.getByTestId('zero')).toHaveTextContent('0 €')
    })

    it('should format large currency values with German locale', () => {
      expect(screen.getByTestId('large')).toHaveTextContent('1.234.567,89 €')
    })
  })

  describe('Number formatting edge cases', () => {
    it('should handle very small numbers', () => {
      function SmallNumberTestComponent() {
        const format = useFormatter()
        return (
          <div>
            <div data-testid="small-decimal">
              {format.number(0.001, 'decimal')}
            </div>
            <div data-testid="small-percent">
              {format.number(0.001, 'percent')}
            </div>
          </div>
        )
      }

      render(<SmallNumberTestComponent />)

      expect(screen.getByTestId('small-decimal')).toHaveTextContent('0.00')
      expect(screen.getByTestId('small-percent')).toHaveTextContent('0.1%')
    })

    it('should handle very large numbers', () => {
      function LargeNumberTestComponent() {
        const format = useFormatter()
        return (
          <div>
            <div data-testid="large-decimal">
              {format.number(999999999.99, 'decimal')}
            </div>
            <div data-testid="large-currency">
              {format.number(999999999.99, 'currency')}
            </div>
          </div>
        )
      }

      render(<LargeNumberTestComponent />)

      expect(screen.getByTestId('large-decimal')).toHaveTextContent(
        '999,999,999.99',
      )
      expect(screen.getByTestId('large-currency')).toHaveTextContent(
        '€999,999,999.99',
      )
    })

    it('should handle different currency symbols', () => {
      function CurrencyTestComponent() {
        const format = useFormatter()
        return (
          <div>
            <div data-testid="eur">
              {format.number(100, 'currency', { currency: 'EUR' })}
            </div>
            <div data-testid="usd">
              {format.number(100, 'currency', { currency: 'USD' })}
            </div>
          </div>
        )
      }

      render(<CurrencyTestComponent />)

      expect(screen.getByTestId('eur')).toHaveTextContent('€100')
      expect(screen.getByTestId('usd')).toHaveTextContent('$100')
    })
  })
})
