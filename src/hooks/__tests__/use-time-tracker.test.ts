import { act, renderHook, waitFor } from '@testing-library/react'

import * as timeEntryService from '@/services/time-entry-service'
import * as userSettingsService from '@/services/user-settings-service'

import { useTimeTracker } from '../use-time-tracker'

// Mock the service functions
jest.mock('@/services/time-entry-service')
jest.mock('@/services/user-settings-service')

describe('useTimeTracker', () => {
  const mockToast = jest.fn()
  const mockT = jest.fn((key) => key)
  const user = { uid: 'user1' }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(timeEntryService, 'getTimeEntries').mockResolvedValue([])
    jest.spyOn(userSettingsService, 'getUserSettings').mockResolvedValue({
      language: 'en',
      defaultWorkHours: 8,
      defaultStartTime: '09:00',
      defaultEndTime: '17:00',
    })
  })

  it('should initialize with default state', async () => {
    const { result } = renderHook(() =>
      useTimeTracker(user, mockToast, mockT, 'en'),
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.entries).toEqual([])
    expect(result.current.selectedDate).toBeInstanceOf(Date)
    expect(result.current.userSettings).toBeDefined()
  })

  it('should update runningTimer when handleStartTimer is called', async () => {
    const { result } = renderHook(() =>
      useTimeTracker(user, mockToast, mockT, 'en'),
    )
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
})
