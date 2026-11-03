import {
  AllTheProviders,
  act,
  defaultMockAuth,
  renderHook,
  waitFor,
} from '@jest-setup'

import { getPricingPlans } from '@/services/payment-service'
import { getPublishedMonth } from '@/services/published-export-service'
import { subscriptionService } from '@/services/subscription-service'
import {
  acceptTeamInvitation,
  declineTeamInvitation,
  getTeam,
  getTeamInvitation,
  getTeamInvitations,
  getTeamMembers,
  getTeamSubscription,
  getUserInvitations,
  getUserTeam,
} from '@/services/team-service'
import { getTimeEntries } from '@/services/time-entry-service'
import { getUserSettings } from '@/services/user-settings-service'

import { useExportPreviewData, usePublishedMonth } from '../use-export-preview'
import { usePricingPlans } from '../use-pricing-plans'
import { useUserSubscription } from '../use-subscription'
import { useTeam, useTeamInvitation, useTeamPageData } from '../use-team'
import {
  useAcceptInvitation,
  useDeclineInvitation,
  useUserInvitations,
} from '../use-user-invitations'
import { useUserSettings } from '../use-user-settings'

jest.mock('@/services/user-settings-service')
jest.mock('@/services/team-service')
jest.mock('@/services/time-entry-service')
jest.mock('@/services/published-export-service')
jest.mock('@/services/payment-service', () => ({
  getPricingPlans: jest.fn(),
}))
jest.mock('@/services/subscription-service', () => ({
  subscriptionService: {
    getUserSubscription: jest.fn(),
    clearCache: jest.fn(),
  },
}))

const user = { uid: 'user-1', email: 'user@example.com' }
const mockUser = {
  uid: 'user-1',
  email: 'user@example.com',
  displayName: null,
}

const wrapper = () => AllTheProviders()

describe('domain hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    defaultMockAuth.user = mockUser
    ;(getUserSettings as jest.Mock).mockResolvedValue({
      language: 'en',
      defaultWorkHours: 8,
    })
  })

  afterEach(() => {
    defaultMockAuth.user = null
  })

  describe('useUserSettings', () => {
    it('returns userSettings from the query', async () => {
      const { result } = renderHook(() => useUserSettings(user), {
        wrapper: wrapper(),
      })

      await waitFor(() =>
        expect(result.current.userSettings?.defaultWorkHours).toBe(8),
      )
      expect(getUserSettings).toHaveBeenCalledWith('user-1')
    })

    it('does not fetch without a user', () => {
      renderHook(() => useUserSettings(null), { wrapper: wrapper() })
      expect(getUserSettings).not.toHaveBeenCalled()
    })
  })

  describe('useUserInvitations', () => {
    it('returns pending invitations for the signed-in user', async () => {
      ;(getUserInvitations as jest.Mock).mockResolvedValue([
        { id: 'inv-1', status: 'pending' },
      ])

      const { result } = renderHook(() => useUserInvitations(), {
        wrapper: wrapper(),
      })

      await waitFor(() => expect(result.current.invitations).toHaveLength(1))
      expect(getUserInvitations).toHaveBeenCalledWith('user@example.com')
    })

    it('accept mutation calls acceptTeamInvitation with user context', async () => {
      ;(acceptTeamInvitation as jest.Mock).mockResolvedValue(undefined)
      ;(getUserInvitations as jest.Mock).mockResolvedValue([])

      const { result } = renderHook(() => useAcceptInvitation(), {
        wrapper: wrapper(),
      })

      await act(async () => {
        await result.current.mutateAsync('inv-1')
      })

      expect(acceptTeamInvitation).toHaveBeenCalledWith(
        'inv-1',
        'user-1',
        'user@example.com',
      )
    })

    it('decline mutation calls declineTeamInvitation', async () => {
      ;(declineTeamInvitation as jest.Mock).mockResolvedValue(undefined)

      const { result } = renderHook(() => useDeclineInvitation(), {
        wrapper: wrapper(),
      })

      await act(async () => {
        await result.current.mutateAsync('inv-2')
      })

      expect(declineTeamInvitation).toHaveBeenCalledWith('inv-2')
    })
  })

  describe('usePricingPlans', () => {
    it('returns pricing plans', async () => {
      const plans = [{ id: 'plan-1', stripePriceId: 'price_1' }]
      ;(getPricingPlans as jest.Mock).mockResolvedValue(plans)

      const { result } = renderHook(() => usePricingPlans(), {
        wrapper: wrapper(),
      })

      await waitFor(() => expect(result.current.data).toEqual(plans))
    })
  })

  describe('useUserSubscription', () => {
    it('fetches the subscription via subscriptionService', async () => {
      ;(subscriptionService.getUserSubscription as jest.Mock).mockResolvedValue(
        {
          subscription: { status: 'active' },
          ownerId: 'user-1',
        },
      )

      const { result } = renderHook(() => useUserSubscription(user), {
        wrapper: wrapper(),
      })

      await waitFor(() =>
        expect(result.current.data?.subscription?.status).toBe('active'),
      )
      expect(subscriptionService.getUserSubscription).toHaveBeenCalledWith(
        'user-1',
      )
    })
  })

  describe('useTeamPageData', () => {
    it('returns the bundled team data', async () => {
      const team = { id: 'team-1', name: 'Test' }
      const members = [{ id: 'user-1', role: 'owner' }]
      ;(getUserTeam as jest.Mock).mockResolvedValue(team)
      ;(getTeamMembers as jest.Mock).mockResolvedValue(members)
      ;(getTeamInvitations as jest.Mock).mockResolvedValue([])
      ;(getTeamSubscription as jest.Mock).mockResolvedValue(null)

      const { result } = renderHook(() => useTeamPageData(user), {
        wrapper: wrapper(),
      })

      await waitFor(() => expect(result.current.data?.team).toEqual(team))
      expect(result.current.data?.currentUserRole).toBe('owner')
    })

    it('returns user invitations when the user has no team', async () => {
      ;(getUserTeam as jest.Mock).mockResolvedValue(null)
      ;(getUserInvitations as jest.Mock).mockResolvedValue([{ id: 'inv-1' }])

      const { result } = renderHook(() => useTeamPageData(user), {
        wrapper: wrapper(),
      })

      await waitFor(() =>
        expect(result.current.data?.userInvitations).toHaveLength(1),
      )
      expect(result.current.data?.team).toBeNull()
    })

    it('tolerates partial failures in secondary fetches', async () => {
      ;(getUserTeam as jest.Mock).mockResolvedValue({
        id: 'team-1',
        name: 'Test',
      })
      ;(getTeamMembers as jest.Mock).mockRejectedValue(
        new Error('members fail'),
      )
      ;(getTeamInvitations as jest.Mock).mockResolvedValue([])
      ;(getTeamSubscription as jest.Mock).mockResolvedValue(null)

      const { result } = renderHook(() => useTeamPageData(user), {
        wrapper: wrapper(),
      })

      await waitFor(() => expect(result.current.data?.team?.id).toBe('team-1'))
      expect(result.current.data?.members).toEqual([])
    })
  })

  describe('useTeam / useTeamInvitation', () => {
    it('fetches a team by id', async () => {
      ;(getTeam as jest.Mock).mockResolvedValue({ id: 'team-9' })

      const { result } = renderHook(() => useTeam('team-9'), {
        wrapper: wrapper(),
      })

      await waitFor(() => expect(result.current.data?.id).toBe('team-9'))
    })

    it('fetches an invitation by id', async () => {
      ;(getTeamInvitation as jest.Mock).mockResolvedValue({
        id: 'inv-9',
        status: 'pending',
      })

      const { result } = renderHook(() => useTeamInvitation('inv-9'), {
        wrapper: wrapper(),
      })

      await waitFor(() => expect(result.current.data?.id).toBe('inv-9'))
    })
  })

  describe('usePublishedMonth / useExportPreviewData', () => {
    it('fetches published month data', async () => {
      ;(getPublishedMonth as jest.Mock).mockResolvedValue({
        entries: [],
        userSettings: null,
      })

      const { result } = renderHook(
        () => usePublishedMonth('team-1', 'member-1', '2024-01'),
        { wrapper: wrapper() },
      )

      await waitFor(() => expect(result.current.data).not.toBeUndefined())
      expect(getPublishedMonth).toHaveBeenCalledWith(
        'team-1',
        'member-1',
        '2024-01',
      )
    })

    it('returns the export preview bundle', async () => {
      ;(getTimeEntries as jest.Mock).mockResolvedValue([{ id: 'e1' }])
      ;(getUserTeam as jest.Mock).mockResolvedValue(null)

      const { result } = renderHook(() => useExportPreviewData(user), {
        wrapper: wrapper(),
      })

      await waitFor(() => expect(result.current.data?.entries).toHaveLength(1))
      expect(result.current.data?.userSettings?.defaultWorkHours).toBe(8)
      expect(result.current.data?.userTeam).toBeNull()
    })
  })
})
