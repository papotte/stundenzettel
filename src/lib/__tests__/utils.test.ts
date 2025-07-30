import type { TimeEntry } from '../types'
import {
  compareEntriesByStartTime,
  formatAppNumber,
  formatAppTime,
  formatCurrency,
  formatDecimalHours,
  formatDuration,
  formatHoursAndMinutes,
  formatMinutesToTimeInput,
  getUserId,
  timeStringToMinutes,
} from '../utils'

describe('utils', () => {
  describe('formatDuration', () => {
    it('should format seconds into HH:mm:ss', () => {
      expect(formatDuration(0)).toBe('00:00:00')
      expect(formatDuration(59)).toBe('00:00:59')
      expect(formatDuration(60)).toBe('00:01:00')
      expect(formatDuration(3600)).toBe('01:00:00')
      expect(formatDuration(3661)).toBe('01:01:01')
    })

    it('should handle invalid input', () => {
      expect(formatDuration(NaN)).toBe('00:00:00')
      expect(formatDuration(-100)).toBe('00:00:00')
    })
  })

  describe('formatHoursAndMinutes', () => {
    it('should format minutes into Xh Ym format', () => {
      expect(formatHoursAndMinutes(0)).toBe('0h 0m')
      expect(formatHoursAndMinutes(59)).toBe('0h 59m')
      expect(formatHoursAndMinutes(60)).toBe('1h 0m')
      expect(formatHoursAndMinutes(90)).toBe('1h 30m')
      expect(formatHoursAndMinutes(125.5)).toBe('2h 6m') // rounds minutes
    })
  })

  describe('formatDecimalHours', () => {
    it('should convert minutes to decimal hours with two decimal places', () => {
      expect(formatDecimalHours(90)).toBe('1.50')
      expect(formatDecimalHours(30)).toBe('0.50')
      expect(formatDecimalHours(45)).toBe('0.75')
      expect(formatDecimalHours(0)).toBe('0.00')
      expect(formatDecimalHours(undefined)).toBe('0.00')
      expect(formatDecimalHours(null)).toBe('0.00')
    })
  })

  describe('timeStringToMinutes', () => {
    it('should convert HH:mm string to total minutes', () => {
      expect(timeStringToMinutes('01:30')).toBe(90)
      expect(timeStringToMinutes('00:45')).toBe(45)
      expect(timeStringToMinutes('00:00')).toBe(0)
      expect(timeStringToMinutes(undefined)).toBe(0)
      expect(timeStringToMinutes(null)).toBe(0)
      expect(timeStringToMinutes('invalid')).toBe(0)
    })
  })

  describe('formatMinutesToTimeInput', () => {
    it('should format total minutes to HH:mm string', () => {
      expect(formatMinutesToTimeInput(90)).toBe('01:30')
      expect(formatMinutesToTimeInput(45)).toBe('00:45')
      expect(formatMinutesToTimeInput(0)).toBe('00:00')
      expect(formatMinutesToTimeInput(undefined)).toBe('00:00')
      expect(formatMinutesToTimeInput(null)).toBe('00:00')
    })
  })

  describe('formatAppNumber', () => {
    it('should format number in English', () => {
      expect(formatAppNumber(1234567.89, 'en')).toBe('1,234,567.89')
    })
    it('should format number in German', () => {
      expect(formatAppNumber(1234567.89, 'de')).toBe('1.234.567,89')
    })
    it('should format number with custom options', () => {
      expect(formatAppNumber(0.5, 'en', { style: 'percent' })).toBe('50%')
    })
  })

  describe('formatCurrency', () => {
    it('should format EUR in en locale', () => {
      expect(formatCurrency(1234.56, 'EUR', 'en')).toBe('€1,234.56')
    })
    it('should format USD in en locale', () => {
      expect(formatCurrency(1234.56, 'USD', 'en')).toBe('$1,234.56')
    })
    it('should format EUR in de locale', () => {
      expect(formatCurrency(1234.56, 'EUR', 'de')).toBe('1.234,56 €')
    })
    it('should format JPY in en locale (no decimals)', () => {
      expect(formatCurrency(1234, 'JPY', 'en')).toBe('¥1,234')
    })
    it('should handle zero and negative values', () => {
      expect(formatCurrency(0, 'USD', 'en')).toBe('$0')
      expect(formatCurrency(-99.99, 'USD', 'en')).toBe('-$99.99')
    })
    it('should default to en locale if not provided', () => {
      expect(formatCurrency(100, 'USD')).toBe('$100')
    })
  })

  describe('compareEntriesByStartTime', () => {
    const now = new Date('2024-01-10T12:00:00')
    const earlier = new Date('2024-01-09T12:00:00')
    const later = new Date('2024-01-11T12:00:00')

    const intervalEntry1: TimeEntry = {
      id: '1',
      userId: 'u',
      location: 'A',
      startTime: now,
      endTime: later,
    }
    const intervalEntry2: TimeEntry = {
      id: '2',
      userId: 'u',
      location: 'B',
      startTime: earlier,
      endTime: now,
    }
    const durationEntry1: TimeEntry = {
      id: '3',
      userId: 'u',
      location: 'C',
      startTime: now,
      durationMinutes: 60,
    }
    const durationEntry2: TimeEntry = {
      id: '4',
      userId: 'u',
      location: 'D',
      startTime: earlier,
      durationMinutes: 120,
    }

    it('sorts interval entries by startTime descending', () => {
      const arr = [intervalEntry2, intervalEntry1]
      arr.sort(compareEntriesByStartTime)
      expect(arr[0]).toBe(intervalEntry1)
      expect(arr[1]).toBe(intervalEntry2)
    })

    it('puts all duration-only entries after interval entries, even if they have a startTime', () => {
      const arr = [
        durationEntry1,
        intervalEntry1,
        durationEntry2,
        intervalEntry2,
      ]
      arr.sort(compareEntriesByStartTime)
      expect(arr.slice(0, 2)).toEqual([intervalEntry1, intervalEntry2])
      expect(arr.slice(2)).toEqual([durationEntry1, durationEntry2])
    })
  })

  describe('formatAppTime', () => {
    it('formats a typical time correctly', () => {
      const date = new Date('2024-01-10T09:05:00')
      expect(formatAppTime(date)).toBe('09:05')
    })
    it('formats midnight as 00:00', () => {
      const date = new Date('2024-01-10T00:00:00')
      expect(formatAppTime(date)).toBe('00:00')
    })
    it('formats single-digit hours and minutes with leading zeros', () => {
      const date = new Date('2024-01-10T03:07:00')
      expect(formatAppTime(date)).toBe('03:07')
    })
    it('formats 23:59 correctly', () => {
      const date = new Date('2024-01-10T23:59:00')
      expect(formatAppTime(date)).toBe('23:59')
    })
  })

  describe('getUserId', () => {
    it('returns uid if present', () => {
      expect(getUserId({ uid: 'abc123', email: 'test@example.com' })).toBe(
        'abc123',
      )
    })
    it('returns email if uid is missing', () => {
      expect(getUserId({ email: 'test@example.com' })).toBe('test@example.com')
    })
    it('returns undefined if user is null', () => {
      expect(getUserId(null)).toBeUndefined()
    })
    it('returns undefined if user is undefined', () => {
      expect(getUserId(undefined)).toBeUndefined()
    })
    it('returns undefined if neither uid nor email is present', () => {
      expect(getUserId({})).toBeUndefined()
    })
  })
})
