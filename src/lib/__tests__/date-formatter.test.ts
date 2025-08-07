import { createDateFormatter, formatDateTime } from '../date-formatter'

describe('date-formatter', () => {
  // Create a date using local timezone to avoid timezone conversion issues
  const testDate = new Date(2024, 0, 15, 14, 30, 0) // January 15, 2024, 14:30 local time

  describe('formatDateTime', () => {
    it('formats dates using format string', () => {
      expect(formatDateTime(testDate, 'yyyy-MM-dd')).toBe('2024-01-15')
    })

    it('formats dates correctly in English', () => {
      expect(formatDateTime(testDate, 'long', 'en')).toBe(
        'Monday, January 15th, 2024',
      )
      expect(formatDateTime(testDate, 'short', 'en')).toBe('01/15/2024')
      expect(formatDateTime(testDate, 'shortTime', 'en')).toBe('14:30')
      expect(formatDateTime(testDate, 'month', 'en')).toBe('January')
      expect(formatDateTime(testDate, 'monthYear', 'en')).toBe('January 2024')
      expect(formatDateTime(testDate, 'yearMonth', 'en')).toBe('2024/1')
      expect(formatDateTime(testDate, 'weekday', 'en')).toBe('Mon')
    })

    it('formats dates correctly in German', () => {
      expect(formatDateTime(testDate, 'long', 'de')).toBe(
        'Montag, 15. Januar 2024',
      )
      expect(formatDateTime(testDate, 'short', 'de')).toBe('15.01.2024')
      expect(formatDateTime(testDate, 'shortTime', 'de')).toBe('14:30')
      expect(formatDateTime(testDate, 'month', 'de')).toBe('Januar')
      expect(formatDateTime(testDate, 'monthYear', 'de')).toBe('Januar 2024')
      expect(formatDateTime(testDate, 'yearMonth', 'de')).toBe('2024/1')
      expect(formatDateTime(testDate, 'weekday', 'de')).toBe('Mo.')
    })

    it('formats time consistently', () => {
      // Test that time formatting works and is consistent
      const timeResult = formatDateTime(testDate, 'shortTime', 'en')
      expect(timeResult).toMatch(/^\d{2}:\d{2}$/)

      const germanTimeResult = formatDateTime(testDate, 'shortTime', 'de')
      expect(germanTimeResult).toMatch(/^\d{2}:\d{2}$/)
    })
  })

  describe('createDateFormatter', () => {
    it('creates formatter with correct locale', () => {
      const enFormatter = createDateFormatter('en')
      const deFormatter = createDateFormatter('de')

      expect(enFormatter.dateTime(testDate, 'month')).toBe('January')
      expect(deFormatter.dateTime(testDate, 'month')).toBe('Januar')
    })
  })
})
