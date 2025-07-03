process.env.NEXT_PUBLIC_ENVIRONMENT = 'test'

import type { TimeEntry } from '@/lib/types'

import {
  addTimeEntry,
  deleteAllTimeEntries,
  deleteTimeEntry,
  getTimeEntries,
  updateTimeEntry,
} from '../time-entry-service'

// Since the service module decides which implementation to use at load time,
// our tests will automatically use the local service because NEXT_PUBLIC_ENVIRONMENT
// is set to 'test' by Jest's config.
// The tests are written to be independent of each other by creating the data they need.

describe('Time Entry Service (Local Implementation)', () => {
  const mockUserId = 'test-user-for-entry-service'

  // Clear all data for the mock user before each test to ensure isolation
  beforeEach(async () => {
    await deleteAllTimeEntries(mockUserId)
  })

  it('should add a new time entry and retrieve it', async () => {
    const newEntryData: Omit<TimeEntry, 'id'> = {
      userId: mockUserId,
      location: 'Test Location',
      startTime: new Date('2025-01-01T10:00:00Z'),
      endTime: new Date('2025-01-01T11:00:00Z'),
    }

    const newId = await addTimeEntry(newEntryData)
    expect(newId).toBeDefined()

    const allEntries = await getTimeEntries(mockUserId)
    const addedEntry = allEntries.find((e) => e.id === newId)

    expect(addedEntry).toBeDefined()
    expect(addedEntry?.location).toBe('Test Location')
  })

  it('should update an existing time entry', async () => {
    const entryToUpdateData: Omit<TimeEntry, 'id'> = {
      userId: mockUserId,
      location: 'Original Location',
      startTime: new Date('2025-02-01T10:00:00Z'),
    }
    const entryId = await addTimeEntry(entryToUpdateData)

    const updatedLocation = 'Updated Location'
    await updateTimeEntry(entryId, {
      ...entryToUpdateData,
      location: updatedLocation,
      id: entryId,
    })

    const allEntries = await getTimeEntries(mockUserId)
    const updatedEntry = allEntries.find((e) => e.id === entryId)

    expect(updatedEntry).toBeDefined()
    expect(updatedEntry?.location).toBe(updatedLocation)
  })

  it('should delete a specific time entry', async () => {
    const entryToDeleteData: Omit<TimeEntry, 'id'> = {
      userId: mockUserId,
      location: 'Entry To Be Deleted',
      startTime: new Date('2025-03-01T10:00:00Z'),
    }
    const entryId = await addTimeEntry(entryToDeleteData)

    const entriesBeforeDelete = await getTimeEntries(mockUserId)
    expect(entriesBeforeDelete.find((e) => e.id === entryId)).toBeDefined()

    await deleteTimeEntry(mockUserId, entryId)

    const entriesAfterDelete = await getTimeEntries(mockUserId)
    expect(entriesAfterDelete.find((e) => e.id === entryId)).toBeUndefined()
  })

  it('should delete all time entries for a user but not affect others', async () => {
    const userToClear = 'user-to-clear'
    const otherUser = 'other-user-unaffected'

    // Clear any pre-existing data for robust testing
    await deleteAllTimeEntries(userToClear)
    await deleteAllTimeEntries(otherUser)

    await addTimeEntry({
      userId: userToClear,
      location: 'A',
      startTime: new Date(),
    })
    await addTimeEntry({
      userId: userToClear,
      location: 'B',
      startTime: new Date(),
    })
    await addTimeEntry({
      userId: otherUser,
      location: 'C',
      startTime: new Date(),
    })

    let userToClearEntries = await getTimeEntries(userToClear)
    const otherUserEntries = await getTimeEntries(otherUser)
    expect(userToClearEntries.length).toBe(2)
    expect(otherUserEntries.length).toBe(1)

    await deleteAllTimeEntries(userToClear)

    userToClearEntries = await getTimeEntries(userToClear)
    const otherUserEntriesAfter = await getTimeEntries(otherUser)

    expect(userToClearEntries.length).toBe(0)
    expect(otherUserEntriesAfter.length).toBe(1) // Should remain 1
  })

  it('should get entries sorted by start time descending', async () => {
    const sortedUser = 'sorted-user'
    await deleteAllTimeEntries(sortedUser)

    await addTimeEntry({
      userId: sortedUser,
      location: 'Older',
      startTime: new Date('2024-01-01'),
    })
    await addTimeEntry({
      userId: sortedUser,
      location: 'Newer',
      startTime: new Date('2024-01-02'),
    })

    const entries = await getTimeEntries(sortedUser)
    expect(entries[0].location).toBe('Newer')
    expect(entries[1].location).toBe('Older')
  })
})
