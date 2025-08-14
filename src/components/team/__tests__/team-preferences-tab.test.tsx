import { render, screen, fireEvent, waitFor } from '@jest-setup'
import TeamPreferencesTab from '../team-preferences-tab'
import { useToast } from '@/hooks/use-toast'
import { getTeamSettings, setTeamSettings } from '@/services/team-settings-service'
import { Team, TeamSettings } from '@/lib/types'

// Mock the hooks and services
jest.mock('@/hooks/use-toast')
jest.mock('@/services/team-settings-service')
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

const mockToast = jest.fn()
const mockGetTeamSettings = getTeamSettings as jest.MockedFunction<typeof getTeamSettings>
const mockSetTeamSettings = setTeamSettings as jest.MockedFunction<typeof setTeamSettings>

const mockTeam: Team = {
  id: 'team-1',
  name: 'Test Team',
  description: 'Test Description',
  ownerId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockTeamSettings: TeamSettings = {
  exportFields: {
    includeLocation: true,
    includePauseDuration: true,
    includeMileage: true,
    includeDrivingTime: true,
  },
  enableCompensationSplit: true,
  defaultDriverCompensationPercent: 100,
  defaultPassengerCompensationPercent: 90,
  allowMembersToOverrideCompensation: true,
  allowMembersToOverrideExportSettings: false,
  companyName: 'Test Company',
  companyEmail: 'test@company.com',
  companyPhone1: '+1234567890',
  companyPhone2: '+0987654321',
  companyFax: '+1122334455',
}

describe('TeamPreferencesTab', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useToast as any).mockReturnValue({ toast: mockToast })
    mockGetTeamSettings.mockResolvedValue(mockTeamSettings)
    mockSetTeamSettings.mockResolvedValue(undefined)
  })

  describe('Rendering', () => {
    it('renders all sections correctly', async () => {
      render(
        <TeamPreferencesTab
          team={mockTeam}
          currentUserRole="owner"
          onTeamUpdated={jest.fn()}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('teams.teamPreferences')).toBeInTheDocument()
        expect(screen.getByText('teams.trackingConfiguration')).toBeInTheDocument()
        expect(screen.getByText('teams.compensationDefaults')).toBeInTheDocument()
        expect(screen.getByText('teams.overridePermissions')).toBeInTheDocument()
        expect(screen.getByText('teams.teamCompanyDetails')).toBeInTheDocument()
      })
    })

    it('hides compensation section when driving time is disabled', async () => {
      const settingsWithoutDriving = {
        ...mockTeamSettings,
        exportFields: { ...mockTeamSettings.exportFields, includeDrivingTime: false }
      }
      mockGetTeamSettings.mockResolvedValue(settingsWithoutDriving)

      render(
        <TeamPreferencesTab
          team={mockTeam}
          currentUserRole="owner"
          onTeamUpdated={jest.fn()}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText('teams.compensationDefaults')).not.toBeInTheDocument()
      })
    })
  })

  describe('Role-based Access Control', () => {
    it('enables editing for owners', async () => {
      render(
        <TeamPreferencesTab
          team={mockTeam}
          currentUserRole="owner"
          onTeamUpdated={jest.fn()}
        />
      )

      await waitFor(() => {
        const saveButtons = screen.getAllByText('common.save')
        saveButtons.forEach(button => {
          expect(button).not.toBeDisabled()
        })

        const checkboxes = screen.getAllByRole('checkbox')
        checkboxes.forEach(checkbox => {
          expect(checkbox).not.toBeDisabled()
        })
      })
    })

    it('disables editing for members', async () => {
      render(
        <TeamPreferencesTab
          team={mockTeam}
          currentUserRole="member"
          onTeamUpdated={jest.fn()}
        />
      )

      await waitFor(() => {
        const saveButtons = screen.queryAllByText('common.save')
        expect(saveButtons).toHaveLength(0)

        const checkboxes = screen.getAllByRole('checkbox')
        checkboxes.forEach(checkbox => {
          expect(checkbox).toBeDisabled()
        })
      })
    })
  })

  describe('Settings Management', () => {
    it('saves tracking configuration successfully', async () => {
      const onTeamUpdated = jest.fn()
      render(
        <TeamPreferencesTab
          team={mockTeam}
          currentUserRole="owner"
          onTeamUpdated={onTeamUpdated}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('teams.trackingConfiguration')).toBeInTheDocument()
      })

      // Find and click the tracking configuration save button
      const trackingCard = screen.getByText('teams.trackingConfiguration').closest('.rounded-lg')
      const saveButton = trackingCard?.querySelector('button')
      expect(saveButton).toBeInTheDocument()
      
      fireEvent.click(saveButton!)

      await waitFor(() => {
        expect(mockSetTeamSettings).toHaveBeenCalledWith(mockTeam.id, {
          ...mockTeamSettings,
          exportFormat: mockTeamSettings.exportFormat,
          exportFields: mockTeamSettings.exportFields,
        })
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: 'teams.exportSettingsSaved',
        description: 'teams.exportSettingsSavedDescription',
      })

      expect(onTeamUpdated).toHaveBeenCalledWith(mockTeam)
    })

    it('saves compensation settings successfully', async () => {
      const onTeamUpdated = jest.fn()
      render(
        <TeamPreferencesTab
          team={mockTeam}
          currentUserRole="owner"
          onTeamUpdated={onTeamUpdated}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('teams.compensationDefaults')).toBeInTheDocument()
      })

      // Find and click the compensation save button
      const compensationCard = screen.getByText('teams.compensationDefaults').closest('.rounded-lg')
      const saveButton = compensationCard?.querySelector('button')
      expect(saveButton).toBeInTheDocument()
      
      fireEvent.click(saveButton!)

      await waitFor(() => {
        expect(mockSetTeamSettings).toHaveBeenCalledWith(mockTeam.id, {
          ...mockTeamSettings,
          enableCompensationSplit: mockTeamSettings.enableCompensationSplit,
          defaultDriverCompensationPercent: mockTeamSettings.defaultDriverCompensationPercent,
          defaultPassengerCompensationPercent: mockTeamSettings.defaultPassengerCompensationPercent,
        })
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: 'teams.compensationSettingsSaved',
        description: 'teams.compensationSettingsSavedDescription',
      })

      expect(onTeamUpdated).toHaveBeenCalledWith(mockTeam)
    })

    it('handles save failures gracefully', async () => {
      mockSetTeamSettings.mockRejectedValue(new Error('Save failed'))
      
      render(
        <TeamPreferencesTab
          team={mockTeam}
          currentUserRole="owner"
          onTeamUpdated={jest.fn()}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('teams.trackingConfiguration')).toBeInTheDocument()
      })

      const trackingCard = screen.getByText('teams.trackingConfiguration').closest('.rounded-lg')
      const saveButton = trackingCard?.querySelector('button')
      fireEvent.click(saveButton!)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'common.error',
          description: 'Save failed',
          variant: 'destructive',
        })
      })
    })
  })

  describe('Data Loading', () => {
    it('loads team settings on mount', async () => {
      render(
        <TeamPreferencesTab
          team={mockTeam}
          currentUserRole="owner"
          onTeamUpdated={jest.fn()}
        />
      )

      await waitFor(() => {
        expect(mockGetTeamSettings).toHaveBeenCalledWith(mockTeam.id)
      })
    })

    it('handles loading failure gracefully', async () => {
      mockGetTeamSettings.mockRejectedValue(new Error('Load failed'))
      
      render(
        <TeamPreferencesTab
          team={mockTeam}
          currentUserRole="owner"
          onTeamUpdated={jest.fn()}
        />
      )

      // Should render without crashing
      expect(screen.getByText('teams.teamPreferences')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined team settings gracefully', async () => {
      mockGetTeamSettings.mockResolvedValue(undefined as any)
      
      render(
        <TeamPreferencesTab
          team={mockTeam}
          currentUserRole="owner"
          onTeamUpdated={jest.fn()}
        />
      )

      // Should render without crashing
      expect(screen.getByText('teams.teamPreferences')).toBeInTheDocument()
    })

    it('handles empty export fields', async () => {
      const settingsWithEmptyExport = {
        ...mockTeamSettings,
        exportFields: {}
      }
      mockGetTeamSettings.mockResolvedValue(settingsWithEmptyExport)

      render(
        <TeamPreferencesTab
          team={mockTeam}
          currentUserRole="owner"
          onTeamUpdated={jest.fn()}
        />
      )

      // Should render without crashing
      expect(screen.getByText('teams.teamPreferences')).toBeInTheDocument()
    })
  })
})
