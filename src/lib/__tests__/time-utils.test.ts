import { differenceInMinutes, set } from 'date-fns'

import type { TimeEntry, UserSettings } from '@/lib/types'

import {
  calculateTotalCompensatedMinutes,
  calculateWeekCompensatedTime,
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

describe('calculateWeekCompensatedTime', () => {
  const mockUserSettings: UserSettings = {
    driverCompensationPercent: 100,
    passengerCompensationPercent: 90,
    language: 'en',
  }

  const createMockGetEntriesForDay = (
    entriesByDay: Record<string, TimeEntry[]>,
  ) => {
    return (day: Date) => {
      const dayKey = day.toISOString().split('T')[0]
      return entriesByDay[dayKey] || []
    }
  }

  it('calculates total for a week with entries', () => {
    const week = [
      new Date('2025-08-01'), // Friday
      new Date('2025-08-02'), // Saturday
      new Date('2025-08-03'), // Sunday
    ]

    const entriesByDay = {
      '2025-08-01': [
        {
          id: '1',
          userId: 'u1',
          location: 'Test',
          startTime: set(new Date('2025-08-01'), { hours: 9, minutes: 0 }),
          endTime: set(new Date('2025-08-01'), { hours: 17, minutes: 0 }),
          pauseDuration: 30,
        } as TimeEntry,
      ],
      '2025-08-02': [
        {
          id: '2',
          userId: 'u1',
          location: 'Test',
          startTime: set(new Date('2025-08-02'), { hours: 10, minutes: 0 }),
          endTime: set(new Date('2025-08-02'), { hours: 14, minutes: 0 }),
          pauseDuration: 0,
        } as TimeEntry,
      ],
    }

    const getEntriesForDay = createMockGetEntriesForDay(entriesByDay)
    const result = calculateWeekCompensatedTime(
      week,
      getEntriesForDay,
      mockUserSettings,
    )

    // Friday: 8 hours - 0.5 hours pause = 7.5 hours
    // Saturday: 4 hours - 0 hours pause = 4 hours
    // Sunday: 0 hours
    // Total: 11.5 hours
    expect(result).toBe(11.5)
  })

  it('filters by selected month when provided', () => {
    // Week spanning July 28 - August 3, 2025
    const week = [
      new Date('2025-07-28'), // Monday (July)
      new Date('2025-07-29'), // Tuesday (July)
      new Date('2025-07-30'), // Wednesday (July)
      new Date('2025-07-31'), // Thursday (July)
      new Date('2025-08-01'), // Friday (August)
      new Date('2025-08-02'), // Saturday (August)
      new Date('2025-08-03'), // Sunday (August)
    ]

    const august2025 = new Date('2025-08-01')

    const entriesByDay = {
      '2025-07-31': [
        {
          id: '1',
          userId: 'u1',
          location: 'Test',
          startTime: set(new Date('2025-07-31'), { hours: 9, minutes: 0 }),
          endTime: set(new Date('2025-07-31'), { hours: 17, minutes: 0 }),
          pauseDuration: 30,
        } as TimeEntry,
      ],
      '2025-08-01': [
        {
          id: '2',
          userId: 'u1',
          location: 'Test',
          startTime: set(new Date('2025-08-01'), { hours: 9, minutes: 0 }),
          endTime: set(new Date('2025-08-01'), { hours: 17, minutes: 0 }),
          pauseDuration: 30,
        } as TimeEntry,
      ],
      '2025-08-02': [
        {
          id: '3',
          userId: 'u1',
          location: 'Test',
          startTime: set(new Date('2025-08-02'), { hours: 10, minutes: 0 }),
          endTime: set(new Date('2025-08-02'), { hours: 14, minutes: 0 }),
          pauseDuration: 0,
        } as TimeEntry,
      ],
    }

    const getEntriesForDay = createMockGetEntriesForDay(entriesByDay)

    // Without month filter - should include all days
    const resultWithoutFilter = calculateWeekCompensatedTime(
      week,
      getEntriesForDay,
      mockUserSettings,
    )
    // July 31: 8 hours - 0.5 hours = 7.5 hours
    // August 1: 8 hours - 0.5 hours = 7.5 hours
    // August 2: 4 hours - 0 hours = 4 hours
    // Total: 19 hours
    expect(resultWithoutFilter).toBe(19)

    // With August filter - should only include August days
    const resultWithFilter = calculateWeekCompensatedTime(
      week,
      getEntriesForDay,
      mockUserSettings,
      august2025,
    )
    // August 1: 8 hours - 0.5 hours = 7.5 hours
    // August 2: 4 hours - 0 hours = 4 hours
    // Total: 11.5 hours
    expect(resultWithFilter).toBe(11.5)
  })

  it('handles special day entries correctly', () => {
    const week = [new Date('2025-08-01'), new Date('2025-08-02')]

    const entriesByDay = {
      '2025-08-01': [
        {
          id: '1',
          userId: 'u1',
          location: 'SICK_LEAVE',
          startTime: set(new Date('2025-08-01'), { hours: 9, minutes: 0 }),
          endTime: set(new Date('2025-08-01'), { hours: 17, minutes: 0 }),
          pauseDuration: 30, // Should be ignored for special days
        } as TimeEntry,
      ],
      '2025-08-02': [
        {
          id: '2',
          userId: 'u1',
          location: 'PTO',
          startTime: set(new Date('2025-08-02'), { hours: 10, minutes: 0 }),
          endTime: set(new Date('2025-08-02'), { hours: 14, minutes: 0 }),
          pauseDuration: 60, // Should be ignored for special days
        } as TimeEntry,
      ],
    }

    const getEntriesForDay = createMockGetEntriesForDay(entriesByDay)
    const result = calculateWeekCompensatedTime(
      week,
      getEntriesForDay,
      mockUserSettings,
    )

    // SICK_LEAVE: 8 hours (pause ignored)
    // PTO: 4 hours (pause ignored)
    // Total: 12 hours
    expect(result).toBe(12)
  })

  it('ignores TIME_OFF_IN_LIEU entries', () => {
    const week = [new Date('2025-08-01'), new Date('2025-08-02')]

    const entriesByDay = {
      '2025-08-01': [
        {
          id: '1',
          userId: 'u1',
          location: 'TIME_OFF_IN_LIEU',
          startTime: set(new Date('2025-08-01'), { hours: 9, minutes: 0 }),
          endTime: set(new Date('2025-08-01'), { hours: 17, minutes: 0 }),
          pauseDuration: 30,
        } as TimeEntry,
      ],
      '2025-08-02': [
        {
          id: '2',
          userId: 'u1',
          location: 'Test',
          startTime: set(new Date('2025-08-02'), { hours: 10, minutes: 0 }),
          endTime: set(new Date('2025-08-02'), { hours: 14, minutes: 0 }),
          pauseDuration: 0,
        } as TimeEntry,
      ],
    }

    const getEntriesForDay = createMockGetEntriesForDay(entriesByDay)
    const result = calculateWeekCompensatedTime(
      week,
      getEntriesForDay,
      mockUserSettings,
    )

    // TIME_OFF_IN_LIEU: 0 hours (ignored)
    // Test: 4 hours - 0 hours = 4 hours
    // Total: 4 hours
    expect(result).toBe(4)
  })

  it('returns 0 when userSettings is null', () => {
    const week = [new Date('2025-08-01')]
    const getEntriesForDay = () => []

    const result = calculateWeekCompensatedTime(week, getEntriesForDay, null)
    expect(result).toBe(0)
  })

  it('handles empty week', () => {
    const week: Date[] = []
    const getEntriesForDay = () => []

    const result = calculateWeekCompensatedTime(
      week,
      getEntriesForDay,
      mockUserSettings,
    )
    expect(result).toBe(0)
  })

  it('handles week with no entries', () => {
    const week = [new Date('2025-08-01'), new Date('2025-08-02')]
    const getEntriesForDay = () => []

    const result = calculateWeekCompensatedTime(
      week,
      getEntriesForDay,
      mockUserSettings,
    )
    expect(result).toBe(0)
  })
})
