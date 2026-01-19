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
})
