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
}
