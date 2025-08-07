import { Formats } from 'use-intl'

export const formattingProps: Formats = {
  number: {
    decimal: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
    percent: {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
    currency: {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    integer: {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    },
  },
}
