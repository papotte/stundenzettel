import {
  suggestEndTimes,
  suggestLocations,
  suggestStartTimes,
  suggestTravelTimes,
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
      travelTime: 1,
    }, // Mon
    {
      id: '2',
      userId: 'u',
      location: 'Home',
      startTime: new Date('2024-06-04T08:30:00'),
      endTime: new Date('2024-06-04T16:00:00'),
      travelTime: 0.5,
    }, // Tue
    {
      id: '3',
      userId: 'u',
      location: 'Office',
      startTime: new Date('2024-06-05T09:00:00'),
      endTime: new Date('2024-06-05T17:00:00'),
      travelTime: 1,
    }, // Wed
    {
      id: '4',
      userId: 'u',
      location: 'Client Site',
      startTime: new Date('2024-06-06T10:00:00'),
      endTime: new Date('2024-06-06T15:00:00'),
      travelTime: 2,
    }, // Thu
    {
      id: '5',
      userId: 'u',
      location: 'Office',
      startTime: new Date('2024-06-07T09:00:00'),
      endTime: new Date('2024-06-07T17:00:00'),
      travelTime: 1,
    }, // Fri
    {
      id: '6',
      userId: 'u',
      location: 'Home',
      startTime: new Date('2024-06-08T08:30:00'),
      endTime: new Date('2024-06-08T16:00:00'),
      travelTime: 0.5,
    }, // Sat
    {
      id: '7',
      userId: 'u',
      location: 'Office',
      startTime: new Date('2024-06-10T09:00:00'),
      endTime: new Date('2024-06-10T17:00:00'),
      travelTime: 1.5,
    }, // Mon
    {
      id: '8',
      userId: 'u',
      location: 'Office',
      startTime: new Date('2024-06-11T08:00:00'),
      endTime: new Date('2024-06-11T16:00:00'),
    }, // Tue (no travel)
  ]

  it('suggestLocations returns an array', () => {
    expect(Array.isArray(suggestLocations(mockEntries))).toBe(true)
  })

  it('suggestLocations returns most frequent locations first by default', () => {
    const result = suggestLocations(mockEntries)
    expect(result[0]).toBe('Office') // Office appears most
    expect(result).toContain('Home')
    expect(result).toContain('Client Site')
  })

  it('suggestLocations respects limit', () => {
    const result = suggestLocations(mockEntries, { limit: 2 })
    expect(result.length).toBe(2)
  })

  it('suggestLocations breaks frequency ties by recency', () => {
    const result = suggestLocations(mockEntries)
    const homeIndex = result.indexOf('Home')
    const clientIndex = result.indexOf('Client Site')
    expect(homeIndex).toBeLessThan(clientIndex)
  })

  it('suggestLocations with recentFirst returns most recent locations first', () => {
    const result = suggestLocations(mockEntries, { recentFirst: true })
    expect(result[0]).toBe('Office')
    expect(result[1]).toBe('Home')
  })

  it('suggestLocations returns empty array for no entries', () => {
    expect(suggestLocations([])).toEqual([])
  })

  it('suggestLocations filters by filterText (case-insensitive, partial)', () => {
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

  it('suggestStartTimes returns most common start times', () => {
    const result = suggestStartTimes(mockEntries)
    expect(result).toEqual(['09:00', '08:30', '08:00'])
  })

  it('suggestStartTimes limits results', () => {
    const result = suggestStartTimes(mockEntries, { limit: 1 })
    expect(result.length).toBe(1)
  })

  it('suggestStartTimes filters by location', () => {
    const result = suggestStartTimes(mockEntries, { location: 'Home' })
    expect(result).toEqual(['08:30'])
  })

  it('suggestStartTimes filters by dayOfWeek', () => {
    // Monday = 1 in JS Date (0 = Sunday)
    const result = suggestStartTimes(mockEntries, { dayOfWeek: 1 })
    expect(result).toEqual(['09:00'])
  })

  it('suggestStartTimes returns empty array for no entries', () => {
    expect(suggestStartTimes([])).toEqual([])
  })

  it('suggestEndTimes returns most common end times', () => {
    const result = suggestEndTimes(mockEntries)
    expect(result[0]).toBe('17:00')
    expect(result).toContain('16:00')
    expect(result).toContain('15:00')
  })

  it('suggestEndTimes limits results', () => {
    const result = suggestEndTimes(mockEntries, { limit: 1 })
    expect(result.length).toBe(1)
  })

  it('suggestEndTimes filters by location', () => {
    const result = suggestEndTimes(mockEntries, { location: 'Home' })
    expect(result).toEqual(['16:00'])
  })

  it('suggestEndTimes filters by dayOfWeek', () => {
    // Monday = 1 in JS Date (0 = Sunday)
    const result = suggestEndTimes(mockEntries, { dayOfWeek: 1 })
    expect(result).toEqual(['17:00'])
  })

  it('suggestEndTimes returns empty array for no entries', () => {
    expect(suggestEndTimes([])).toEqual([])
  })

  it('suggestTravelTimes returns an array', () => {
    expect(Array.isArray(suggestTravelTimes(mockEntries))).toBe(true)
  })

  it('suggestTravelTimes returns most common travel times', () => {
    const result = suggestTravelTimes(mockEntries)
    expect(result).toEqual([1, 0.5, 1.5])
  })

  it('suggestTravelTimes includes less common values if limit is increased', () => {
    const result = suggestTravelTimes(mockEntries, { limit: 5 })
    expect(result).toContain(2)
  })

  it('suggestTravelTimes limits results', () => {
    const result = suggestTravelTimes(mockEntries, { limit: 2 })
    expect(result.length).toBe(2)
  })

  it('suggestTravelTimes filters by location', () => {
    const result = suggestTravelTimes(mockEntries, { location: 'Home' })
    expect(result).toEqual([0.5])
  })

  it('suggestTravelTimes returns empty array for no entries', () => {
    expect(suggestTravelTimes([])).toEqual([])
  })
})
