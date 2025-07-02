import {
  formatDecimalHours,
  formatDuration,
  formatHoursAndMinutes,
  formatMinutesToTimeInput,
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
})
