import { differenceInMinutes, set } from 'date-fns'

import type { TimeEntry } from '@/lib/types'

import { calculateTotalCompensatedMinutes } from '../time-utils'

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
