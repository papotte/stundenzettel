'use client'

import { useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import type { Team, TeamSettings } from '@/lib/types'
import {
  getTeamSettings,
  setTeamSettings,
} from '@/services/team-settings-service'

interface TeamPreferencesTabProps {
  team: Team
  currentUserRole: 'owner' | 'admin' | 'member'
  onTeamUpdated?: (updatedTeam: Team) => void
}

export function TeamPreferencesTab({
  team,
  currentUserRole,
  onTeamUpdated,
}: TeamPreferencesTabProps) {
  const [exportLoading, setExportLoading] = useState(false)
  const [compensationLoading, setCompensationLoading] = useState(false)
  const [permissionsLoading, setPermissionsLoading] = useState(false)
  const [companyLoading, setCompanyLoading] = useState(false)
  const [teamSettings, setTeamSettingsState] = useState<TeamSettings>({})
  const { toast } = useToast()
  const t = useTranslations()

  const canEdit = currentUserRole === 'owner' || currentUserRole === 'admin'

  // Load team settings when component mounts
  useEffect(() => {
    loadTeamSettings()
  }, [])

  const loadTeamSettings = async () => {
    try {
      const settings = await getTeamSettings(team.id)
      setTeamSettingsState(settings)
    } catch (error) {
      console.error('Failed to load team settings:', error)
    }
  }

  const handleSaveExportSettings = async () => {
    if (!canEdit) return

    setExportLoading(true)
    try {
      // Save the current teamSettings state (which includes all the latest changes)
      await setTeamSettings(team.id, teamSettings)

      // Call the callback to notify parent component
      onTeamUpdated?.(team)

      toast({
        title: t('teams.exportSettingsSaved'),
        description: t('teams.exportSettingsSavedDescription'),
      })
    } catch (error) {
      toast({
        title: t('common.error'),
        description:
          error instanceof Error
            ? error.message
            : t('teams.failedToSaveExportSettings'),
        variant: 'destructive',
      })
    } finally {
      setExportLoading(false)
    }
  }

  const handleSaveCompensationSettings = async () => {
    if (!canEdit) return

    setCompensationLoading(true)
    try {
      // Save the current teamSettings state (which includes all the latest changes)
      await setTeamSettings(team.id, teamSettings)

      // Call the callback to notify parent component
      onTeamUpdated?.(team)

      toast({
        title: t('teams.compensationSettingsSaved'),
        description: t('teams.compensationSettingsSavedDescription'),
      })
    } catch (error) {
      toast({
        title: t('common.error'),
        description:
          error instanceof Error
            ? error.message
            : t('teams.failedToSaveCompensationSettings'),
        variant: 'destructive',
      })
    } finally {
      setCompensationLoading(false)
    }
  }

  const handleSavePermissionsSettings = async () => {
    if (!canEdit) return

    setPermissionsLoading(true)
    try {
      // Save the current teamSettings state (which includes all the latest changes)
      await setTeamSettings(team.id, teamSettings)

      // Call the callback to notify parent component
      onTeamUpdated?.(team)

      toast({
        title: t('teams.permissionsSettingsSaved'),
        description: t('teams.permissionsSettingsSavedDescription'),
      })
    } catch (error) {
      toast({
        title: t('common.error'),
        description:
          error instanceof Error
            ? error.message
            : t('teams.failedToSavePermissionsSettings'),
        variant: 'destructive',
      })
    } finally {
      setPermissionsLoading(false)
    }
  }

  const handleSaveCompanySettings = async () => {
    if (!canEdit) return

    setCompanyLoading(true)
    try {
      const companySettings = {
        companyName: teamSettings.companyName,
        companyEmail: teamSettings.companyEmail,
        companyPhone1: teamSettings.companyPhone1,
        companyPhone2: teamSettings.companyPhone2,
        companyFax: teamSettings.companyFax,
      }

      await setTeamSettings(team.id, { ...teamSettings, ...companySettings })

      // Call the callback to notify parent component
      onTeamUpdated?.(team)

      toast({
        title: t('teams.companySettingsSaved'),
        description: t('teams.companySettingsSavedDescription'),
      })
    } catch (error) {
      toast({
        title: t('common.error'),
        description:
          error instanceof Error
            ? error.message
            : t('teams.failedToSaveCompanySettings'),
        variant: 'destructive',
      })
    } finally {
      setCompanyLoading(false)
    }
  }

  const updateTeamSetting = <K extends keyof TeamSettings>(
    key: K,
    value: TeamSettings[K],
  ) => {
    setTeamSettingsState((prev) => ({ ...prev, [key]: value }))
  }

  const updateExportField = (field: string, value: boolean) => {
    setTeamSettingsState((prev) => ({
      ...prev,
      exportFields: {
        ...prev.exportFields,
        [field]: value,
      },
    }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t('teams.teamPreferences')}</CardTitle>
            <CardDescription>
              {canEdit
                ? t('teams.teamPreferencesDescription')
                : t('teams.preferencesViewDescription')}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {/* Tracking Configuration */}
      <Card data-testid="tracking-configuration-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {t('teams.trackingConfiguration')}
              </CardTitle>
              <CardDescription>
                {t('teams.trackingConfigurationDescription')}
              </CardDescription>
            </div>
            {canEdit && (
              <Button
                onClick={handleSaveExportSettings}
                disabled={exportLoading}
                size="sm"
                data-testid="save-tracking-configuration"
              >
                {exportLoading ? t('common.saving') : t('common.save')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>{t('teams.exportFormat')}</Label>
            <Select
              value={teamSettings.exportFormat || 'excel'}
              onValueChange={(value) =>
                updateTeamSetting(
                  'exportFormat',
                  value as 'excel' | 'pdf' | 'both',
                )
              }
              disabled={!canEdit}
              aria-label={t('teams.exportFormat')}
            >
              <SelectTrigger data-testid="export-format-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">
                  {t('teams.exportFormatExcel')}
                </SelectItem>
                <SelectItem value="pdf">
                  {t('teams.exportFormatPdf')}
                </SelectItem>
                <SelectItem value="both">
                  {t('teams.exportFormatBoth')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>{t('teams.trackingOptions')}</Label>
            <div className="space-y-2">
              {[
                {
                  key: 'includeLocation',
                  label: t('teams.includeLocationInExport'),
                },
                {
                  key: 'includePauseDuration',
                  label: t('teams.includePauseDurationInExport'),
                },
                {
                  key: 'includeMileage',
                  label: t('teams.includeMileageInExport'),
                },
                {
                  key: 'includeDrivingTime',
                  label: t('teams.includeDrivingTimeInExport'),
                },
              ].map(({ key, label }) => {
                // For regular export fields
                return (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={
                        teamSettings.exportFields?.[
                          key as keyof typeof teamSettings.exportFields
                        ] ?? true
                      }
                      onCheckedChange={(checked) =>
                        updateExportField(key, checked as boolean)
                      }
                      disabled={!canEdit}
                    />
                    <Label htmlFor={key} className="text-sm font-normal">
                      {label}
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compensation Defaults */}
      {teamSettings.exportFields?.includeDrivingTime !== false && (
        <Card data-testid="compensation-defaults-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {t('teams.compensationDefaults')}
                </CardTitle>
                <CardDescription>
                  {t('teams.compensationDefaultsDescription')}
                </CardDescription>
              </div>
              {canEdit && (
                <Button
                  onClick={handleSaveCompensationSettings}
                  disabled={compensationLoading}
                  size="sm"
                  data-testid="save-compensation-defaults"
                >
                  {compensationLoading ? t('common.saving') : t('common.save')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enable-compensation-split"
                checked={teamSettings.enableCompensationSplit ?? true}
                onCheckedChange={(checked) =>
                  updateTeamSetting(
                    'enableCompensationSplit',
                    checked as boolean,
                  )
                }
                disabled={!canEdit}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="enable-compensation-split"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t('teams.enableCompensationSplit')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('teams.enableCompensationSplitDescription')}
                </p>
              </div>
            </div>

            {(teamSettings.enableCompensationSplit ?? true) && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="default-driver-compensation">
                    {t('teams.defaultDriverCompensation')}
                  </Label>
                  <Input
                    id="default-driver-compensation"
                    type="number"
                    min="0"
                    max="100"
                    value={teamSettings.defaultDriverCompensationPercent || 100}
                    onChange={(e) =>
                      updateTeamSetting(
                        'defaultDriverCompensationPercent',
                        parseInt(e.target.value) || 100,
                      )
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="default-passenger-compensation">
                    {t('teams.defaultPassengerCompensation')}
                  </Label>
                  <Input
                    id="default-passenger-compensation"
                    type="number"
                    min="0"
                    max="100"
                    value={
                      teamSettings.defaultPassengerCompensationPercent || 90
                    }
                    onChange={(e) =>
                      updateTeamSetting(
                        'defaultPassengerCompensationPercent',
                        parseInt(e.target.value) || 90,
                      )
                    }
                    disabled={!canEdit}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Override Permissions */}
      <Card data-testid="override-permissions-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {t('teams.overridePermissions')}
              </CardTitle>
              <CardDescription>
                {t('teams.overridePermissionsDescription')}
              </CardDescription>
            </div>
            {canEdit && (
              <Button
                onClick={handleSavePermissionsSettings}
                disabled={permissionsLoading}
                size="sm"
                data-testid="save-override-permissions"
              >
                {permissionsLoading ? t('common.saving') : t('common.save')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              key: 'allowMembersToOverrideCompensation',
              label: t('teams.allowOverrideCompensation'),
            },
            {
              key: 'allowMembersToOverrideExportSettings',
              label: t('teams.allowOverrideExportSettings'),
            },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={key}
                checked={
                  Boolean(teamSettings[key as keyof TeamSettings]) ?? true
                }
                onCheckedChange={(checked) =>
                  updateTeamSetting(
                    key as keyof TeamSettings,
                    checked as boolean,
                  )
                }
                disabled={!canEdit}
              />
              <Label htmlFor={key} className="text-sm font-normal">
                {label}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Team Company Details */}
      <Card data-testid="team-company-details-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {t('teams.teamCompanyDetails')}
              </CardTitle>
              <CardDescription>
                {t('teams.teamCompanyDetailsDescription')}
              </CardDescription>
            </div>
            {canEdit && (
              <Button
                onClick={handleSaveCompanySettings}
                disabled={companyLoading}
                size="sm"
                data-testid="save-team-company-details"
              >
                {companyLoading ? t('common.saving') : t('common.save')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="team-company-name">
              {t('settings.companyName')}
            </Label>
            <Input
              id="team-company-name"
              value={teamSettings.companyName || ''}
              onChange={(e) => updateTeamSetting('companyName', e.target.value)}
              placeholder={t('settings.companyNamePlaceholder')}
              disabled={!canEdit}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="team-company-email">
              {t('settings.companyEmail')}
            </Label>
            <Input
              id="team-company-email"
              type="email"
              value={teamSettings.companyEmail || ''}
              onChange={(e) =>
                updateTeamSetting('companyEmail', e.target.value)
              }
              placeholder={t('settings.companyEmailPlaceholder')}
              disabled={!canEdit}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="team-company-phone1">
                {t('settings.companyPhone1')}
              </Label>
              <Input
                id="team-company-phone1"
                value={teamSettings.companyPhone1 || ''}
                onChange={(e) =>
                  updateTeamSetting('companyPhone1', e.target.value)
                }
                placeholder={t('settings.companyPhone1Placeholder')}
                disabled={!canEdit}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="team-company-phone2">
                {t('settings.companyPhone2')}
              </Label>
              <Input
                id="team-company-phone2"
                value={teamSettings.companyPhone2 || ''}
                onChange={(e) =>
                  updateTeamSetting('companyPhone2', e.target.value)
                }
                placeholder={t('settings.companyPhone2Placeholder')}
                disabled={!canEdit}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="team-company-fax">{t('settings.companyFax')}</Label>
            <Input
              id="team-company-fax"
              value={teamSettings.companyFax || ''}
              onChange={(e) => updateTeamSetting('companyFax', e.target.value)}
              placeholder={t('settings.companyFaxPlaceholder')}
              disabled={!canEdit}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TeamPreferencesTab
