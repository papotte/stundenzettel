import { AllTheProviders, act, renderHook, waitFor } from '@jest-setup'

import * as timeEntryService from '@/services/time-entry-service'
import * as userSettingsService from '@/services/user-settings-service'

import { useTimeTracker } from '../use-time-tracker'

const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

jest.mock('@/services/time-entry-service')
jest.mock('@/services/user-settings-service')

describe('useTimeTracker', () => {
  const user = { uid: 'user1' }

  beforeEach(() => {
    jest.clearAllMocks()
    mockToast.mockClear()
    jest.spyOn(timeEntryService, 'getTimeEntries').mockResolvedValue([])
    jest.spyOn(userSettingsService, 'getUserSettings').mockResolvedValue({
      language: 'en',
      defaultWorkHours: 8,
      defaultStartTime: '09:00',
      defaultEndTime: '17:00',
    })
  })

  function renderTimeTracker() {
    const { result } = renderHook(() => useTimeTracker(user), {
      wrapper: AllTheProviders(),
    })
    return result
  }

  it('should initialize with default state', async () => {
    const result = renderTimeTracker()
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.entries).toEqual([])
    expect(result.current.selectedDate).toBeInstanceOf(Date)
    expect(result.current.userSettings).toBeDefined()
  })

  it('should update runningTimer when handleStartTimer is called', async () => {
    const result = renderTimeTracker()
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    act(() => {
      result.current.setLocation('Office')
    })
    await waitFor(() => expect(result.current.location).toBe('Office'))

    act(() => {
      result.current.handleStartTimer()
    })
    expect(result.current.runningTimer).not.toBeNull()
    expect(result.current.runningTimer?.location).toBe('Office')
  })

  it('should show toast and not start timer when handleStartTimer is called without location', async () => {
    const result = renderTimeTracker()
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.handleStartTimer()
    })

    expect(result.current.runningTimer).toBeNull()
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'toasts.locationRequiredTitle',
        variant: 'destructive',
      }),
    )
  })

  it('should not call addTimeEntry and show toast when adding duplicate special entry', async () => {
    const today = new Date()
    const ptoEntry = {
      id: '1',
      userId: 'user1',
      location: 'PTO',
      startTime: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        12,
        0,
      ),
      durationMinutes: 480,
      pauseDuration: 0,
    }
    jest.spyOn(timeEntryService, 'getTimeEntries').mockResolvedValue([ptoEntry])
    const addSpy = jest.spyOn(timeEntryService, 'addTimeEntry')

    const result = renderTimeTracker()
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.handleAddSpecialEntry('PTO')
    })

    expect(addSpy).not.toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'toasts.entryExistsTitle',
        variant: 'destructive',
      }),
    )
  })

  describe('copy handlers', () => {
    it('handleCopyEntryTo should shift entry, call addTimeEntry, and update state', async () => {
      const { subDays } = await import('date-fns')
      const base = new Date()
      const start = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate(),
        9,
        0,
      )
      const end = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate(),
        17,
        0,
      )
      const entry = {
        id: 'e1',
        userId: 'user1',
        location: 'Office',
        startTime: start,
        endTime: end,
        pauseDuration: 30,
      }
      jest.spyOn(timeEntryService, 'getTimeEntries').mockResolvedValue([entry])
      const addSpy = jest
        .spyOn(timeEntryService, 'addTimeEntry')
        .mockResolvedValue('new-id')

      const result = renderTimeTracker()
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const targetDate = subDays(base, 5)
      await act(async () => {
        await result.current.handleCopyEntryTo(entry, targetDate)
      })

      expect(addSpy).toHaveBeenCalledTimes(1)
      const added = addSpy.mock.calls[0][0]
      expect(added.userId).toBe('user1')
      expect(added.location).toBe('Office')
      expect(added.startTime.getDate()).toBe(targetDate.getDate())
      expect(added.startTime.getMonth()).toBe(targetDate.getMonth())
      expect(added.startTime.getHours()).toBe(9)
      expect(added.endTime?.getHours()).toBe(17)
      expect(result.current.entries).toHaveLength(2)
      expect(result.current.entries.some((e) => e.id === 'new-id')).toBe(true)
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'toasts.entryCopiedTitle',
        }),
      )
    })

    it('handleCopyDayTo should copy all filtered entries to target date', async () => {
      const { subDays } = await import('date-fns')
      const base = new Date()
      const dayStart = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate(),
        9,
        0,
      )
      const dayEnd = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate(),
        17,
        0,
      )
      const e1 = {
        id: 'e1',
        userId: 'user1',
        location: 'A',
        startTime: dayStart,
        endTime: dayEnd,
      }
      const e2 = {
        id: 'e2',
        userId: 'user1',
        location: 'B',
        startTime: dayStart,
        endTime: dayEnd,
      }
      jest.spyOn(timeEntryService, 'getTimeEntries').mockResolvedValue([e1, e2])
      const addSpy = jest
        .spyOn(timeEntryService, 'addTimeEntry')
        .mockResolvedValueOnce('id-a')
        .mockResolvedValueOnce('id-b')

      const result = renderTimeTracker()
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const targetDate = subDays(base, 3)
      await act(async () => {
        await result.current.handleCopyDayTo(targetDate)
      })

      expect(addSpy).toHaveBeenCalledTimes(2)
      expect(result.current.entries).toHaveLength(4)
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'toasts.entriesCopiedToTitle',
        }),
      )
    })

    it('handleCopyFromYesterday should copy yesterday entries to today when viewing today', async () => {
      const { subDays } = await import('date-fns')
      const today = new Date()
      const yesterday = subDays(today, 1)
      const yesStart = new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(),
        9,
        0,
      )
      const yesEnd = new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(),
        17,
        0,
      )
      const yesterdayEntry = {
        id: 'y1',
        userId: 'user1',
        location: 'Yesterday Office',
        startTime: yesStart,
        endTime: yesEnd,
      }
      jest
        .spyOn(timeEntryService, 'getTimeEntries')
        .mockResolvedValue([yesterdayEntry])
      const addSpy = jest
        .spyOn(timeEntryService, 'addTimeEntry')
        .mockResolvedValue('copied-id')

      const result = renderTimeTracker()
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.selectedDate).toBeDefined()
      expect(result.current.entries).toHaveLength(1)

      await act(async () => {
        await result.current.handleCopyFromYesterday()
      })

      expect(addSpy).toHaveBeenCalledTimes(1)
      const added = addSpy.mock.calls[0][0]
      expect(added.location).toBe('Yesterday Office')
      expect(added.startTime.getDate()).toBe(today.getDate())
      expect(added.startTime.getMonth()).toBe(today.getMonth())
      expect(result.current.entries).toHaveLength(2)
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'toasts.entriesCopiedFromYesterdayTitle',
        }),
      )
    })
  })
})
