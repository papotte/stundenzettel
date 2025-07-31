import { Formats } from 'use-intl'

export const formattingProps: Formats = {
  dateTime: {
    long: {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      weekday: 'long',
    },
    short: {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    },
    shortTime: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
    month: {
      month: 'long',
    },
    monthYear: {
      month: 'long',
      year: 'numeric',
    },
    yearMonth: {
      year: 'numeric',
      month: 'numeric',
    },
    weekday: {
      weekday: 'short',
    },
  },
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
