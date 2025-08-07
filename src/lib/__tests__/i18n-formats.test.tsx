import React from 'react'

import { render, renderWithGermanLocale } from '@jest-setup'
import '@testing-library/jest-dom'
import { screen } from '@testing-library/react'

import { useFormatter } from 'next-intl'

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
