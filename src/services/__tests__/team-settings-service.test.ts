import { doc, getDoc, setDoc } from 'firebase/firestore'
import type { DocumentReference, DocumentSnapshot } from 'firebase/firestore'

import type { TeamSettings } from '@/lib/types'

import * as teamSettingsService from '../team-settings-service'

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({
  db: {},
}))

const mockDoc = doc as jest.MockedFunction<typeof doc>
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>

const defaultTeamSettings: TeamSettings = {
  defaultDriverCompensationPercent: 100,
  defaultPassengerCompensationPercent: 90,
  allowMemberOverrideCompensation: true,
  exportIncludeDriverTime: true,
  exportIncludePassengerTime: true,
  allowMemberOverrideExport: true,
}

describe('Team Settings Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getTeamSettings', () => {
    it('returns default settings when no teamId is provided', async () => {
      const result = await teamSettingsService.getTeamSettings('')
      expect(result).toEqual(defaultTeamSettings)
      expect(mockGetDoc).not.toHaveBeenCalled()
    })

    it('returns default settings when document does not exist', async () => {
      const mockDocRef = {}
      const mockDocSnap = { exists: () => false }

      mockDoc.mockReturnValue(mockDocRef as DocumentReference)
      mockGetDoc.mockResolvedValue(mockDocSnap as unknown as DocumentSnapshot)

      const result = await teamSettingsService.getTeamSettings('team-123')

      expect(mockDoc).toHaveBeenCalledWith(
        {},
        'teams',
        'team-123',
        'settings',
        'general',
      )
      expect(result).toEqual(defaultTeamSettings)
    })

    it('returns merged settings when document exists', async () => {
      const storedSettings = {
        defaultDriverCompensationPercent: 80,
        allowMemberOverrideCompensation: false,
      }
      const mockDocRef = {}
      const mockDocSnap = {
        exists: () => true,
        data: () => storedSettings,
      }

      mockDoc.mockReturnValue(mockDocRef as DocumentReference)
      mockGetDoc.mockResolvedValue(mockDocSnap as unknown as DocumentSnapshot)

      const result = await teamSettingsService.getTeamSettings('team-456')

      expect(result).toEqual({
        ...defaultTeamSettings,
        ...storedSettings,
      })
    })
  })

  describe('setTeamSettings', () => {
    it('throws error when no teamId is provided', async () => {
      await expect(teamSettingsService.setTeamSettings('', {})).rejects.toThrow(
        'Team ID is required',
      )
    })

    it('calls setDoc with correct parameters', async () => {
      const settings: Partial<TeamSettings> = {
        defaultDriverCompensationPercent: 75,
        allowMemberOverrideCompensation: false,
      }
      const mockDocRef = {}
      mockDoc.mockReturnValue(mockDocRef as DocumentReference)
      mockSetDoc.mockResolvedValue(undefined)

      await teamSettingsService.setTeamSettings('team-789', settings)

      expect(mockDoc).toHaveBeenCalledWith(
        {},
        'teams',
        'team-789',
        'settings',
        'general',
      )
      expect(mockSetDoc).toHaveBeenCalledWith(mockDocRef, settings, {
        merge: true,
      })
    })

    it('filters out undefined values before saving', async () => {
      const settings: Partial<TeamSettings> = {
        defaultDriverCompensationPercent: 90,
        defaultPassengerCompensationPercent: undefined,
      }
      const mockDocRef = {}
      mockDoc.mockReturnValue(mockDocRef as DocumentReference)
      mockSetDoc.mockResolvedValue(undefined)

      await teamSettingsService.setTeamSettings('team-789', settings)

      expect(mockSetDoc).toHaveBeenCalledWith(
        mockDocRef,
        { defaultDriverCompensationPercent: 90 },
        { merge: true },
      )
    })
  })
})
