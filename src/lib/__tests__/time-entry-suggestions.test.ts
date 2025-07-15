import {
  suggestDriverTimes,
  suggestEndTimes,
  suggestLocations,
  suggestPassengerTimes,
  suggestStartTimes,
} from '../time-entry-suggestions'
import type { TimeEntry } from '../types'

describe('time-entry-suggestions utility', () => {
  const mockEntries: TimeEntry[] = [
    {
      id: '1',
      userId: 'u',
      location: 'Office',
      startTime: new Date('2024-06-03T09:00:00'),
      endTime: new Date('2024-06-03T17:00:00'),
      driverTimeHours: 1,
      passengerTimeHours: 1,
    }, // Mon
    {
      id: '2',
      userId: 'u',
      location: 'Home',
      startTime: new Date('2024-06-04T08:30:00'),
      endTime: new Date('2024-06-04T16:00:00'),
      driverTimeHours: 0.5,
      passengerTimeHours: 0.5,
    }, // Tue
    {
      id: '3',
      userId: 'u',
      location: 'Office',
      startTime: new Date('2024-06-05T09:00:00'),
      endTime: new Date('2024-06-05T17:00:00'),
      driverTimeHours: 1,
      passengerTimeHours: 1,
    }, // Wed
    {
      id: '4',
      userId: 'u',
      location: 'Client Site',
      startTime: new Date('2024-06-06T10:00:00'),
      endTime: new Date('2024-06-06T15:00:00'),
      driverTimeHours: 2,
      passengerTimeHours: 0.5,
    }, // Thu
    {
      id: '5',
      userId: 'u',
      location: 'Office',
      startTime: new Date('2024-06-07T09:00:00'),
      endTime: new Date('2024-06-07T17:00:00'),
      driverTimeHours: 1,
      passengerTimeHours: 1,
    }, // Fri
    {
      id: '6',
      userId: 'u',
      location: 'Home',
      startTime: new Date('2024-06-08T08:30:00'),
      endTime: new Date('2024-06-08T16:00:00'),
      driverTimeHours: 0.5,
      passengerTimeHours: 0.5,
    }, // Sat
    {
      id: '7',
      userId: 'u',
      location: 'Office',
      startTime: new Date('2024-06-10T09:00:00'),
      endTime: new Date('2024-06-10T17:00:00'),
      driverTimeHours: 1.5,
      passengerTimeHours: 1.5,
    }, // Mon
    {
      id: '8',
      userId: 'u',
      location: 'Office',
      startTime: new Date('2024-06-11T08:00:00'),
      endTime: new Date('2024-06-11T16:00:00'),
    }, // Tue (no travel)
  ]

  describe('suggestLocations', () => {
    it('returns an array', () => {
      expect(Array.isArray(suggestLocations(mockEntries))).toBe(true)
    })
    it('returns most frequent locations first by default', () => {
      const result = suggestLocations(mockEntries)
      expect(result[0]).toBe('Office') // Office appears most
      expect(result).toContain('Home')
      expect(result).toContain('Client Site')
    })
    it('respects limit', () => {
      const result = suggestLocations(mockEntries, { limit: 2 })
      expect(result.length).toBe(2)
    })
    it('breaks frequency ties by recency', () => {
      const result = suggestLocations(mockEntries)
      const homeIndex = result.indexOf('Home')
      const clientIndex = result.indexOf('Client Site')
      expect(homeIndex).toBeLessThan(clientIndex)
    })
    it('with recentFirst returns most recent locations first', () => {
      const result = suggestLocations(mockEntries, { recentFirst: true })
      expect(result[0]).toBe('Office')
      expect(result[1]).toBe('Home')
    })
    it('returns empty array for no entries', () => {
      expect(suggestLocations([])).toEqual([])
    })
    it('filters by filterText (case-insensitive, partial)', () => {
      expect(suggestLocations(mockEntries, { filterText: 'off' })).toContain(
        'Office',
      )
      expect(suggestLocations(mockEntries, { filterText: 'home' })).toEqual([
        'Home',
      ])
      expect(suggestLocations(mockEntries, { filterText: 'site' })).toEqual([
        'Client Site',
      ])
      expect(suggestLocations(mockEntries, { filterText: 'xyz' })).toEqual([])
    })
  })

  describe('suggestStartTimes', () => {
    it('returns most common start times', () => {
      const result = suggestStartTimes(mockEntries)
      expect(result).toEqual(['09:00', '08:30', '08:00'])
    })
    it('limits results', () => {
      const result = suggestStartTimes(mockEntries, { limit: 1 })
      expect(result.length).toBe(1)
    })
    it('filters by location', () => {
      const result = suggestStartTimes(mockEntries, { location: 'Home' })
      expect(result).toEqual(['08:30'])
    })
    it('filters by dayOfWeek', () => {
      // Monday = 1 in JS Date (0 = Sunday)
      const result = suggestStartTimes(mockEntries, { dayOfWeek: 1 })
      expect(result).toEqual(['09:00'])
    })
    it('returns empty array for no entries', () => {
      expect(suggestStartTimes([])).toEqual([])
    })
  })

  describe('suggestEndTimes', () => {
    it('returns most common end times', () => {
      const result = suggestEndTimes(mockEntries)
      expect(result[0]).toBe('17:00')
      expect(result).toContain('16:00')
      expect(result).toContain('15:00')
    })
    it('limits results', () => {
      const result = suggestEndTimes(mockEntries, { limit: 1 })
      expect(result.length).toBe(1)
    })
    it('filters by location', () => {
      const result = suggestEndTimes(mockEntries, { location: 'Home' })
      expect(result).toEqual(['16:00'])
    })
    it('filters by dayOfWeek', () => {
      // Monday = 1 in JS Date (0 = Sunday)
      const result = suggestEndTimes(mockEntries, { dayOfWeek: 1 })
      expect(result).toEqual(['17:00'])
    })
    it('returns empty array for no entries', () => {
      expect(suggestEndTimes([])).toEqual([])
    })
  })

  describe('suggestDriverTimes', () => {
    it('returns an array', () => {
      expect(Array.isArray(suggestDriverTimes(mockEntries))).toBe(true)
    })
    it('returns most common travel times', () => {
      const result = suggestDriverTimes(mockEntries)
      expect(result).toEqual([1, 0.5, 1.5])
    })
    it('includes less common values if limit is increased', () => {
      const result = suggestDriverTimes(mockEntries, { limit: 5 })
      expect(result).toContain(2)
    })
    it('limits results', () => {
      const result = suggestDriverTimes(mockEntries, { limit: 2 })
      expect(result.length).toBe(2)
    })
    it('filters by location', () => {
      const result = suggestDriverTimes(mockEntries, {
        location: 'Client Site',
      })
      expect(result).toEqual([2])
    })
    it('returns empty array for no entries', () => {
      expect(suggestDriverTimes([])).toEqual([])
    })
  })

  describe('suggestPassengerTimes', () => {
    it('returns an array', () => {
      expect(Array.isArray(suggestPassengerTimes(mockEntries))).toBe(true)
    })

    it('returns most common passenger times', () => {
      const result = suggestPassengerTimes(mockEntries)
      expect(result).toEqual([0.5, 1, 1.5])
    })

    it('limits results', () => {
      const result = suggestPassengerTimes(mockEntries, { limit: 2 })
      expect(result.length).toBe(2)
      expect(result).toEqual([0.5, 1])
    })

    it('filters by location', () => {
      const result = suggestPassengerTimes(mockEntries, {
        location: 'Client Site',
      })
      expect(result).toEqual([0.5])
    })

    it('returns empty array for a location with no passenger time entries', () => {
      const result = suggestPassengerTimes(mockEntries, {
        location: 'NoSuchPlace',
      })
      expect(result).toEqual([])
    })

    it('returns empty array for no entries', () => {
      expect(suggestPassengerTimes([])).toEqual([])
    })

    it('ignores entries with 0 or undefined passengerTimeHours', () => {
      const entriesWithZero: TimeEntry[] = [
        ...mockEntries,
        {
          id: '9',
          userId: 'u',
          location: 'Office',
          startTime: new Date(),
          passengerTimeHours: 0,
        },
        {
          id: '10',
          userId: 'u',
          location: 'Office',
          startTime: new Date(),
          passengerTimeHours: undefined,
        },
      ]
      const result = suggestPassengerTimes(entriesWithZero, {
        location: 'Office',
      })
      expect(result).not.toContain(0)
    })
  })
})
