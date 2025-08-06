import type { TimeEntry } from '../types'
import {
  compareEntriesByStartTime,
  formatAppNumber,
  formatDecimalHours,
  formatDuration,
  formatHoursAndMinutes,
  formatMinutesToTimeInput,
  getUserId,
  getWeeksForMonth,
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

  describe('getWeeksForMonth', () => {
    it('returns correct weeks for a month starting on Monday', () => {
      // January 2024 starts on Monday
      const january2024 = new Date(2024, 0, 1) // January 1, 2024
      const weeks = getWeeksForMonth(january2024)

      expect(weeks).toHaveLength(5) // January 2024 has 5 weeks

      // First week should start on Monday, January 1
      expect(weeks[0][0].getDate()).toBe(1)
      expect(weeks[0][0].getDay()).toBe(1) // Monday

      // Last week should end on Sunday, February 4
      expect(weeks[4][6].getDate()).toBe(4)
      expect(weeks[4][6].getDay()).toBe(0) // Sunday
    })

    it('returns correct weeks for a month starting on Sunday', () => {
      // December 2024 starts on Sunday
      const december2024 = new Date(2024, 11, 1) // December 1, 2024
      const weeks = getWeeksForMonth(december2024)

      expect(weeks).toHaveLength(6) // December 2024 has 6 weeks (includes partial weeks)

      // First week should start on Monday, November 25
      expect(weeks[0][0].getDate()).toBe(25)
      expect(weeks[0][0].getDay()).toBe(1) // Monday

      // Last week should end on Sunday, January 5, 2025
      expect(weeks[5][6].getDate()).toBe(5)
      expect(weeks[5][6].getDay()).toBe(0) // Sunday
    })

    it('returns correct weeks for August 2025', () => {
      // August 2025 - this was the problematic month mentioned
      const august2025 = new Date(2025, 7, 1) // August 1, 2025
      const weeks = getWeeksForMonth(august2025)

      expect(weeks).toHaveLength(5) // August 2025 has 5 weeks in this timezone

      // First week should start on Monday, July 28, 2025
      expect(weeks[0][0].getDate()).toBe(28)
      expect(weeks[0][0].getMonth()).toBe(6) // July
      expect(weeks[0][0].getDay()).toBe(1) // Monday

      // First week should end on Sunday, August 3, 2025
      expect(weeks[0][6].getDate()).toBe(3)
      expect(weeks[0][6].getMonth()).toBe(7) // August
      expect(weeks[0][6].getDay()).toBe(0) // Sunday

      // Last week should end on Sunday, August 31, 2025
      expect(weeks[4][6].getDate()).toBe(31)
      expect(weeks[4][6].getMonth()).toBe(7) // August
      expect(weeks[4][6].getDay()).toBe(0) // Sunday
    })

    it('each week has exactly 7 days starting on Monday', () => {
      const testDate = new Date(2025, 7, 1) // August 2025
      const weeks = getWeeksForMonth(testDate)

      weeks.forEach((week) => {
        expect(week).toHaveLength(7)

        // Each day should be the correct day of week
        week.forEach((day, dayIndex) => {
          const expectedDayOfWeek = dayIndex === 0 ? 1 : (dayIndex + 1) % 7 // Monday=1, Tuesday=2, ..., Sunday=0
          expect(day.getDay()).toBe(expectedDayOfWeek)
        })
      })
    })
  })
})
