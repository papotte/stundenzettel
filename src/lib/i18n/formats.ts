import { Formats } from 'use-intl'

const defaultTimezone = 'Europe/Berlin'
export const formattingProps: Formats = {
  dateTime: {
    long: {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      weekday: 'long',
      timeZone: defaultTimezone,
    },
    short: {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      timeZone: defaultTimezone,
    },
    shortTime: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: defaultTimezone,
    },
    month: {
      month: 'long',
      timeZone: defaultTimezone,
    },
    monthYear: {
      month: 'long',
      year: 'numeric',
      timeZone: defaultTimezone,
    },
    yearMonth: {
      year: 'numeric',
      month: 'numeric',
      timeZone: defaultTimezone,

    },
    weekday: {
      weekday: 'short',
      timeZone: defaultTimezone,
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
