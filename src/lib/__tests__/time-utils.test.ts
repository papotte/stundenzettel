import { differenceInMinutes, set } from 'date-fns'

import type { TimeEntry, UserSettings } from '@/lib/types'

import {
  calculateExpectedMonthlyHours,
  calculateTotalCompensatedMinutes,
  calculateWeekCompensatedTime,
  calculateWeekPassengerTime,
  parseTimeString,
  shiftEntryToDate,
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

// Shared test data helper for month filtering tests
const createMonthFilterTestData = () => {
  // Week spanning July 28 - August 3, 2025
  // Use Date constructor with explicit year, month, day to avoid timezone issues
  // Month is 0-indexed: 6 = July, 7 = August
  const week = [
    new Date(2025, 6, 28, 12), // Monday (July)
    new Date(2025, 6, 29, 12), // Tuesday (July)
    new Date(2025, 6, 30, 12), // Wednesday (July)
    new Date(2025, 6, 31, 12), // Thursday (July)
    new Date(2025, 7, 1, 12), // Friday (August)
    new Date(2025, 7, 2, 12), // Saturday (August)
    new Date(2025, 7, 3, 12), // Sunday (August)
  ]

  const august2025 = new Date(2025, 7, 1)

  return { week, august2025 }
}

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
    const { week, august2025 } = createMonthFilterTestData()

    const entriesByDay = {
      '2025-07-31': [
        {
          id: '1',
          userId: 'u1',
          location: 'Test',
          startTime: set(new Date(2025, 6, 31), { hours: 9, minutes: 0 }),
          endTime: set(new Date(2025, 6, 31), { hours: 17, minutes: 0 }),
          pauseDuration: 30,
        } as TimeEntry,
      ],
      '2025-08-01': [
        {
          id: '2',
          userId: 'u1',
          location: 'Test',
          startTime: set(new Date(2025, 7, 1), { hours: 9, minutes: 0 }),
          endTime: set(new Date(2025, 7, 1), { hours: 17, minutes: 0 }),
          pauseDuration: 30,
        } as TimeEntry,
      ],
      '2025-08-02': [
        {
          id: '3',
          userId: 'u1',
          location: 'Test',
          startTime: set(new Date(2025, 7, 2), { hours: 10, minutes: 0 }),
          endTime: set(new Date(2025, 7, 2), { hours: 14, minutes: 0 }),
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

describe('calculateWeekPassengerTime', () => {
  const createMockGetEntriesForDay = (
    entriesByDay: Record<string, TimeEntry[]>,
  ) => {
    return (day: Date) => {
      const dayKey = day.toISOString().split('T')[0]
      return entriesByDay[dayKey] || []
    }
  }

  it('calculates total for a week with passenger time entries', () => {
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
          passengerTimeHours: 2.5,
        } as TimeEntry,
      ],
      '2025-08-02': [
        {
          id: '2',
          userId: 'u1',
          location: 'Test',
          startTime: set(new Date('2025-08-02'), { hours: 10, minutes: 0 }),
          endTime: set(new Date('2025-08-02'), { hours: 14, minutes: 0 }),
          passengerTimeHours: 1.5,
        } as TimeEntry,
      ],
    }

    const getEntriesForDay = createMockGetEntriesForDay(entriesByDay)
    const result = calculateWeekPassengerTime(week, getEntriesForDay)

    // Friday: 2.5 hours
    // Saturday: 1.5 hours
    // Sunday: 0 hours
    // Total: 4 hours
    expect(result).toBe(4)
  })

  it('filters by selected month when provided', () => {
    const { week, august2025 } = createMonthFilterTestData()

    const entriesByDay = {
      '2025-07-31': [
        {
          id: '1',
          userId: 'u1',
          location: 'Test',
          startTime: set(new Date(2025, 6, 31), { hours: 9, minutes: 0 }),
          endTime: set(new Date(2025, 6, 31), { hours: 17, minutes: 0 }),
          passengerTimeHours: 3.0,
        } as TimeEntry,
      ],
      '2025-08-01': [
        {
          id: '2',
          userId: 'u1',
          location: 'Test',
          startTime: set(new Date(2025, 7, 1), { hours: 9, minutes: 0 }),
          endTime: set(new Date(2025, 7, 1), { hours: 17, minutes: 0 }),
          passengerTimeHours: 2.0,
        } as TimeEntry,
      ],
      '2025-08-02': [
        {
          id: '3',
          userId: 'u1',
          location: 'Test',
          startTime: set(new Date(2025, 7, 2), { hours: 10, minutes: 0 }),
          endTime: set(new Date(2025, 7, 2), { hours: 14, minutes: 0 }),
          passengerTimeHours: 1.5,
        } as TimeEntry,
      ],
    }

    const getEntriesForDay = createMockGetEntriesForDay(entriesByDay)

    // Without month filter - should include all days
    const resultWithoutFilter = calculateWeekPassengerTime(
      week,
      getEntriesForDay,
    )
    // July 31: 3.0 hours
    // August 1: 2.0 hours
    // August 2: 1.5 hours
    // Total: 6.5 hours
    expect(resultWithoutFilter).toBe(6.5)

    // With August filter - should only include August days
    const resultWithFilter = calculateWeekPassengerTime(
      week,
      getEntriesForDay,
      august2025,
    )
    // August 1: 2.0 hours
    // August 2: 1.5 hours
    // Total: 3.5 hours
    expect(resultWithFilter).toBe(3.5)
  })

  it('handles entries with zero or undefined passenger time', () => {
    const week = [new Date('2025-08-01'), new Date('2025-08-02')]

    const entriesByDay = {
      '2025-08-01': [
        {
          id: '1',
          userId: 'u1',
          location: 'Test',
          startTime: set(new Date('2025-08-01'), { hours: 9, minutes: 0 }),
          endTime: set(new Date('2025-08-01'), { hours: 17, minutes: 0 }),
          passengerTimeHours: 0,
        } as TimeEntry,
      ],
      '2025-08-02': [
        {
          id: '2',
          userId: 'u1',
          location: 'Test',
          startTime: set(new Date('2025-08-02'), { hours: 10, minutes: 0 }),
          endTime: set(new Date('2025-08-02'), { hours: 14, minutes: 0 }),
          passengerTimeHours: undefined,
        } as TimeEntry,
        {
          id: '3',
          userId: 'u1',
          location: 'Test',
          startTime: set(new Date('2025-08-02'), { hours: 15, minutes: 0 }),
          endTime: set(new Date('2025-08-02'), { hours: 17, minutes: 0 }),
          passengerTimeHours: 1.0,
        } as TimeEntry,
      ],
    }

    const getEntriesForDay = createMockGetEntriesForDay(entriesByDay)
    const result = calculateWeekPassengerTime(week, getEntriesForDay)

    // August 1: 0 hours
    // August 2: 0 + 1.0 = 1.0 hours
    // Total: 1.0 hours
    expect(result).toBe(1.0)
  })

  it('handles empty week', () => {
    const week = [new Date('2025-08-01'), new Date('2025-08-02')]
    const getEntriesForDay = () => []

    const result = calculateWeekPassengerTime(week, getEntriesForDay)
    expect(result).toBe(0)
  })
})

describe('calculateExpectedMonthlyHours', () => {
  it('returns default 160 when userSettings is null or empty', () => {
    let result = calculateExpectedMonthlyHours(null)
    expect(result).toBe(160)

    result = calculateExpectedMonthlyHours({})
    expect(result).toBe(160)
  })

  it('uses expectedMonthlyHours when explicitly set', () => {
    const userSettings: UserSettings = { expectedMonthlyHours: 180 }
    const result = calculateExpectedMonthlyHours(userSettings)
    expect(result).toBe(180)
  })

  it('auto-calculates from defaultWorkHours (0.5-step values)', () => {
    const testCases = [
      { defaultWorkHours: 7, expected: 151.5 }, // 7 × 260 ÷ 12 = 151.666... → 151.5
      { defaultWorkHours: 7.5, expected: 162.5 }, // 7.5 × 260 ÷ 12 = 162.5
      { defaultWorkHours: 8, expected: 173 }, // 8 × 260 ÷ 12 = 173.333... → 173.5
      { defaultWorkHours: 6.5, expected: 140.5 }, // 6.5 × 260 ÷ 12 = 140.833... → 140.5
    ]

    testCases.forEach(({ defaultWorkHours, expected }) => {
      const userSettings: UserSettings = { defaultWorkHours }
      const result = calculateExpectedMonthlyHours(userSettings)
      expect(result).toBe(expected)
    })
  })

  it('prioritizes expectedMonthlyHours over defaultWorkHours when both are set', () => {
    const userSettings: UserSettings = {
      defaultWorkHours: 8,
      expectedMonthlyHours: 200,
    }
    const result = calculateExpectedMonthlyHours(userSettings)
    expect(result).toBe(200)
  })
})

describe('shiftEntryToDate', () => {
  it('shifts interval entry to target date preserving times', () => {
    const sourceDate = new Date(2024, 0, 15) // Jan 15, 2024
    const entry: TimeEntry = {
      id: '1',
      userId: 'u1',
      location: 'Office',
      startTime: set(sourceDate, {
        hours: 9,
        minutes: 30,
        seconds: 0,
        milliseconds: 0,
      }),
      endTime: set(sourceDate, {
        hours: 17,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      }),
      pauseDuration: 30,
      driverTimeHours: 1,
      passengerTimeHours: 0.5,
    }
    const targetDate = new Date(2024, 2, 20) // Mar 20, 2024

    const result = shiftEntryToDate(entry, targetDate)

    expect('id' in result).toBe(false)
    expect('userId' in result).toBe(false)
    expect(result.location).toBe('Office')
    expect(result.pauseDuration).toBe(30)
    expect(result.driverTimeHours).toBe(1)
    expect(result.passengerTimeHours).toBe(0.5)
    expect(result.startTime.getFullYear()).toBe(2024)
    expect(result.startTime.getMonth()).toBe(2)
    expect(result.startTime.getDate()).toBe(20)
    expect(result.startTime.getHours()).toBe(9)
    expect(result.startTime.getMinutes()).toBe(30)
    expect(result.endTime).toBeDefined()
    expect(result.endTime!.getFullYear()).toBe(2024)
    expect(result.endTime!.getMonth()).toBe(2)
    expect(result.endTime!.getDate()).toBe(20)
    expect(result.endTime!.getHours()).toBe(17)
    expect(result.endTime!.getMinutes()).toBe(0)
    expect(typeof result.durationMinutes).toBe('undefined')
  })

  it('shifts duration-only entry to target date at midday', () => {
    const sourceDate = new Date(2024, 0, 15)
    const entry: TimeEntry = {
      id: '2',
      userId: 'u1',
      location: 'Home',
      startTime: set(sourceDate, {
        hours: 12,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      }),
      durationMinutes: 480,
    }
    const targetDate = new Date(2024, 5, 10) // Jun 10, 2024

    const result = shiftEntryToDate(entry, targetDate)

    expect('id' in result).toBe(false)
    expect('userId' in result).toBe(false)
    expect(result.location).toBe('Home')
    expect(result.durationMinutes).toBe(480)
    expect(result.startTime.getFullYear()).toBe(2024)
    expect(result.startTime.getMonth()).toBe(5)
    expect(result.startTime.getDate()).toBe(10)
    expect(result.startTime.getHours()).toBe(12)
    expect(result.startTime.getMinutes()).toBe(0)
    expect(result.endTime).toBeUndefined()
  })
})
