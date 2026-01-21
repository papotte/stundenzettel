import { renderHook, waitFor } from '@jest-setup'

import * as userSettingsService from '@/services/user-settings-service'

import { useMemberDisplayNames } from '../use-member-display-names'

jest.mock('@/services/user-settings-service', () => ({
  getDisplayNamesForMembers: jest.fn(),
}))

const mockGetDisplayNamesForMembers =
  userSettingsService.getDisplayNamesForMembers as jest.Mock

describe('useMemberDisplayNames', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns empty Map for empty memberIds and clears when memberIds becomes empty', async () => {
    mockGetDisplayNamesForMembers.mockResolvedValue(
      new Map([['user-1', 'Alice']]),
    )
    const { result, rerender } = renderHook(
      ({ ids }: { ids: string[] }) => useMemberDisplayNames(ids),
      { initialProps: { ids: [] as string[] } },
    )

    expect(result.current.displayNames).toEqual(new Map())
    expect(mockGetDisplayNamesForMembers).not.toHaveBeenCalled()

    rerender({ ids: ['user-1'] })

    await waitFor(() => {
      expect(result.current.displayNames.get('user-1')).toBe('Alice')
    })

    rerender({ ids: [] })

    await waitFor(() => {
      expect(result.current.displayNames).toEqual(new Map())
    })
  })

  it('fetches and returns display names via getDisplayNamesForMembers', async () => {
    mockGetDisplayNamesForMembers.mockResolvedValue(
      new Map([
        ['user-1', 'Alice'],
        ['user-2', 'Bob'],
        ['user-3', ''],
      ]),
    )

    const { result } = renderHook(() =>
      useMemberDisplayNames(['user-1', 'user-2', 'user-3']),
    )

    expect(result.current.displayNames).toEqual(new Map())

    await waitFor(() => {
      expect(result.current.displayNames.get('user-1')).toBe('Alice')
      expect(result.current.displayNames.get('user-2')).toBe('Bob')
      expect(result.current.displayNames.get('user-3')).toBe('')
    })

    expect(mockGetDisplayNamesForMembers).toHaveBeenCalledTimes(1)
    expect(mockGetDisplayNamesForMembers).toHaveBeenCalledWith([
      'user-1',
      'user-2',
      'user-3',
    ])
  })

  it('does not update state if unmounted before load completes', async () => {
    let resolve: (value: Map<string, string>) => void
    const promise = new Promise<Map<string, string>>((r) => {
      resolve = r
    })
    mockGetDisplayNamesForMembers.mockReturnValue(promise)

    const { result, unmount } = renderHook(() =>
      useMemberDisplayNames(['user-1']),
    )

    expect(result.current.displayNames).toEqual(new Map())

    unmount()
    resolve!(new Map([['user-1', 'Late Alice']]))

    await promise

    expect(result.current.displayNames).toEqual(new Map())
  })

  it('re-fetches when memberIds change', async () => {
    mockGetDisplayNamesForMembers
      .mockResolvedValueOnce(new Map([['user-1', 'Alice']]))
      .mockResolvedValueOnce(
        new Map([
          ['user-1', 'Alice'],
          ['user-2', 'Bob'],
        ]),
      )

    const { result, rerender } = renderHook(
      ({ ids }: { ids: string[] }) => useMemberDisplayNames(ids),
      { initialProps: { ids: ['user-1'] } },
    )

    await waitFor(() => {
      expect(result.current.displayNames.get('user-1')).toBe('Alice')
    })
    expect(mockGetDisplayNamesForMembers).toHaveBeenCalledTimes(1)
    expect(mockGetDisplayNamesForMembers).toHaveBeenLastCalledWith(['user-1'])

    rerender({ ids: ['user-1', 'user-2'] })

    await waitFor(() => {
      expect(result.current.displayNames.get('user-1')).toBe('Alice')
      expect(result.current.displayNames.get('user-2')).toBe('Bob')
    })
    expect(mockGetDisplayNamesForMembers).toHaveBeenCalledTimes(2)
    expect(mockGetDisplayNamesForMembers).toHaveBeenLastCalledWith([
      'user-1',
      'user-2',
    ])
  })
})
