import { differenceInMinutes, set } from 'date-fns'

import type { TimeEntry } from '@/lib/types'

import {
  calculateTotalCompensatedMinutes,
  parseTimeString,
} from '../time-utils'

describe('parseTimeString', () => {
  it('parses time strings correctly', () => {
    const baseDate = new Date('2024-01-15T12:00:00Z')

    const result1 = parseTimeString('09:30', baseDate)
    expect(result1.getHours()).toBe(9)
    expect(result1.getMinutes()).toBe(30)
    expect(result1.getDate()).toBe(15)
    expect(result1.getMonth()).toBe(0) // January is 0

    const result2 = parseTimeString('23:45', baseDate)
    expect(result2.getHours()).toBe(23)
    expect(result2.getMinutes()).toBe(45)
  })

  it('is timezone-independent', () => {
    // Test with different base dates to ensure timezone doesn't affect the result
    const date1 = new Date('2024-01-15T00:00:00Z')
    const date2 = new Date('2024-06-15T00:00:00Z')

    const time1 = parseTimeString('14:30', date1)
    const time2 = parseTimeString('14:30', date2)

    expect(time1.getHours()).toBe(14)
    expect(time1.getMinutes()).toBe(30)
    expect(time2.getHours()).toBe(14)
    expect(time2.getMinutes()).toBe(30)
  })

  it('throws error for invalid time format', () => {
    expect(() => parseTimeString('invalid')).toThrow('Invalid time format')
    expect(() => parseTimeString('25:00')).toThrow('Invalid time format')
    expect(() => parseTimeString('12:60')).toThrow('Invalid time format')
  })

  it('uses current date when no base date provided', () => {
    const now = new Date()
    const result = parseTimeString('15:45')

    expect(result.getHours()).toBe(15)
    expect(result.getMinutes()).toBe(45)
    expect(result.getDate()).toBe(now.getDate())
    expect(result.getMonth()).toBe(now.getMonth())
    expect(result.getFullYear()).toBe(now.getFullYear())
  })
})

describe('calculateTotalCompensatedMinutes', () => {
  const baseEntry: Omit<TimeEntry, 'id' | 'userId'> = {
    location: 'Test',
    startTime: set(new Date(), {
      hours: 9,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    }),
    endTime: set(new Date(), {
      hours: 17,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    }),
    pauseDuration: 30,
  }

  it('calculates duration-only entry', () => {
    const entry: TimeEntry = {
      ...baseEntry,
      id: '1',
      userId: 'u1',
      durationMinutes: 120,
    }
    expect(calculateTotalCompensatedMinutes([entry])).toBe(120)
  })

  it('calculates interval entry without driver/passenger', () => {
    const entry: TimeEntry = {
      ...baseEntry,
      id: '2',
      userId: 'u1',
    }
    const expected =
      differenceInMinutes(entry.endTime!, entry.startTime!) -
      (entry.pauseDuration || 0)
    expect(calculateTotalCompensatedMinutes([entry])).toBe(expected)
  })

  it('calculates with driver time and default 100% compensation', () => {
    const entry: TimeEntry = {
      ...baseEntry,
      id: '3',
      userId: 'u1',
      driverTimeHours: 1.5,
    }
    const expected =
      differenceInMinutes(entry.endTime!, entry.startTime!) -
      (entry.pauseDuration || 0) +
      1.5 * 60
    expect(calculateTotalCompensatedMinutes([entry])).toBe(expected)
  })

  it('calculates with passenger time and custom compensation', () => {
    const entry: TimeEntry = {
      ...baseEntry,
      id: '4',
      userId: 'u1',
      passengerTimeHours: 2,
    }
    // 80% compensation for passenger
    const expected =
      differenceInMinutes(entry.endTime!, entry.startTime!) -
      (entry.pauseDuration || 0) +
      2 * 60 * 0.8
    expect(calculateTotalCompensatedMinutes([entry], 100, 80)).toBe(expected)
  })

  it('calculates with both driver and passenger times and custom compensation', () => {
    const entry: TimeEntry = {
      ...baseEntry,
      id: '5',
      userId: 'u1',
      driverTimeHours: 1,
      passengerTimeHours: 1,
    }
    // 90% driver, 80% passenger
    const expected =
      differenceInMinutes(entry.endTime!, entry.startTime!) -
      (entry.pauseDuration || 0) +
      60 * 0.9 +
      60 * 0.8
    expect(calculateTotalCompensatedMinutes([entry], 90, 80)).toBe(expected)
  })

  it('returns 0 for TIME_OFF_IN_LIEU location', () => {
    const entry: TimeEntry = {
      ...baseEntry,
      id: '6',
      userId: 'u1',
      location: 'TIME_OFF_IN_LIEU',
    }
    expect(calculateTotalCompensatedMinutes([entry])).toBe(0)
  })

  it('ignores entries without endTime and durationMinutes', () => {
    const entry: TimeEntry = {
      ...baseEntry,
      id: '7',
      userId: 'u1',
      endTime: undefined,
      durationMinutes: undefined,
    }
    expect(calculateTotalCompensatedMinutes([entry])).toBe(0)
  })
})
