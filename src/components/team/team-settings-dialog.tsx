'use client'

import { useEffect, useState } from 'react'

import { Copy } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import type { Team, TeamSettings } from '@/lib/types'
import { updateTeam } from '@/services/team-service'
import {
  getTeamSettings,
  setTeamSettings,
} from '@/services/team-settings-service'

interface TeamSettingsDialogProps {
  team: Team
  currentUserRole: 'owner' | 'admin' | 'member'
  onTeamUpdated?: (updatedTeam: Team) => void
  children: React.ReactNode
}

export function TeamSettingsDialog({
  team,
  currentUserRole,
  onTeamUpdated,
  children,
}: TeamSettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(team.name)
  const [description, setDescription] = useState(team.description || '')
  const [teamSettings, setTeamSettingsState] = useState<TeamSettings>({})
  const { toast } = useToast()
  const t = useTranslations()

  const canEdit = currentUserRole === 'owner' || currentUserRole === 'admin'

  // Load team settings when dialog opens
  useEffect(() => {
    if (open && canEdit) {
      loadTeamSettings()
    }
  }, [open, canEdit])

  const loadTeamSettings = async () => {
    try {
      const settings = await getTeamSettings(team.id)
      setTeamSettingsState(settings)
    } catch (error) {
      console.error('Failed to load team settings:', error)
    }
  }

  const handleCopyTeamId = async () => {
    try {
      await navigator.clipboard.writeText(team.id)
      toast({
        title: t('teams.teamIdCopied'),
        description: t('teams.teamIdCopiedDescription'),
      })
    } catch {
      toast({
        title: t('common.error'),
        description: t('teams.teamIdCopyError'),
        variant: 'destructive',
      })
    }
  }

  const handleSave = async () => {
    if (!canEdit) return

    setLoading(true)
    try {
      // Update team basic info
      await updateTeam(team.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      })

      // Update team settings
      await setTeamSettings(team.id, teamSettings)

      const updatedTeam: Team = {
        ...team,
        name: name.trim(),
        description: description.trim() || undefined,
        settings: teamSettings,
        updatedAt: new Date(),
      }

      onTeamUpdated?.(updatedTeam)

      toast({
        title: t('teams.teamSettingsSaved'),
        description: t('teams.teamSettingsSavedDescription'),
      })

      setOpen(false)
    } catch (error) {
      toast({
        title: t('common.error'),
        description:
          error instanceof Error
            ? error.message
            : t('teams.failedToSaveTeamSettings'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form to original values
    setName(team.name)
    setDescription(team.description || '')
    setTeamSettingsState(team.settings || {})
    setOpen(false)
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('teams.settings')}</DialogTitle>
          <DialogDescription>
            {canEdit
              ? t('teams.settingsDescription')
              : t('teams.settingsViewDescription')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">{t('common.basic')}</TabsTrigger>
            <TabsTrigger value="team-settings" disabled={!canEdit}>
              {t('teams.teamSettings')}
            </TabsTrigger>
            <TabsTrigger value="info">{t('common.info')}</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="team-name">{t('teams.teamName')}</Label>
                <Input
                  id="team-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canEdit}
                  placeholder={t('teams.teamNamePlaceholder')}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="team-description">
                  {t('teams.description')}
                </Label>
                <Textarea
                  id="team-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!canEdit}
                  placeholder={t('teams.descriptionPlaceholder')}
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team-settings" className="space-y-4">
            <div className="grid gap-6 py-4">
              {/* Export Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t('teams.exportConfiguration')}
                  </CardTitle>
                  <CardDescription>
                    {t('teams.exportConfigurationDescription')}
                  </CardDescription>
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
                    >
                      <SelectTrigger>
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
                    <Label>{t('teams.exportFields')}</Label>
                    <div className="space-y-2">
                      {[
                        {
                          key: 'includeLocation',
                          label: t('teams.includeLocation'),
                        },
                        {
                          key: 'includePauseDuration',
                          label: t('teams.includePauseDuration'),
                        },
                        {
                          key: 'includeDriverTime',
                          label: t('teams.includeDriverTime'),
                        },
                        {
                          key: 'includePassengerTime',
                          label: t('teams.includePassengerTime'),
                        },
                        {
                          key: 'includeMileage',
                          label: t('teams.includeMileage'),
                        },
                      ].map(({ key, label }) => (
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
                          />
                          <Label htmlFor={key} className="text-sm font-normal">
                            {label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compensation Defaults */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t('teams.compensationDefaults')}
                  </CardTitle>
                  <CardDescription>
                    {t('teams.compensationDefaultsDescription')}
                  </CardDescription>
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
                          value={
                            teamSettings.defaultDriverCompensationPercent || 100
                          }
                          onChange={(e) =>
                            updateTeamSetting(
                              'defaultDriverCompensationPercent',
                              parseInt(e.target.value) || 100,
                            )
                          }
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
                            teamSettings.defaultPassengerCompensationPercent ||
                            90
                          }
                          onChange={(e) =>
                            updateTeamSetting(
                              'defaultPassengerCompensationPercent',
                              parseInt(e.target.value) || 90,
                            )
                          }
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Override Permissions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t('teams.overridePermissions')}
                  </CardTitle>
                  <CardDescription>
                    {t('teams.overridePermissionsDescription')}
                  </CardDescription>
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
                    {
                      key: 'allowMembersToOverrideWorkHours',
                      label: t('teams.allowOverrideWorkHours'),
                    },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={
                          Boolean(teamSettings[key as keyof TeamSettings]) ??
                          true
                        }
                        onCheckedChange={(checked) =>
                          updateTeamSetting(
                            key as keyof TeamSettings,
                            checked as boolean,
                          )
                        }
                      />
                      <Label htmlFor={key} className="text-sm font-normal">
                        {label}
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Team Company Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t('teams.teamCompanyDetails')}
                  </CardTitle>
                  <CardDescription>
                    {t('teams.teamCompanyDetailsDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="team-company-name">
                      {t('settings.companyName')}
                    </Label>
                    <Input
                      id="team-company-name"
                      value={teamSettings.companyName || ''}
                      onChange={(e) =>
                        updateTeamSetting('companyName', e.target.value)
                      }
                      placeholder={t('settings.companyNamePlaceholder')}
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
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="team-company-fax">
                      {t('settings.companyFax')}
                    </Label>
                    <Input
                      id="team-company-fax"
                      value={teamSettings.companyFax || ''}
                      onChange={(e) =>
                        updateTeamSetting('companyFax', e.target.value)
                      }
                      placeholder={t('settings.companyFaxPlaceholder')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t('teams.teamId')}</Label>
                <div className="relative">
                  <Input
                    value={team.id}
                    disabled
                    className="font-mono text-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="link"
                    size="icon"
                    onClick={handleCopyTeamId}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    title={t('teams.teamId')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('teams.teamIdDescription')}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          {canEdit && (
            <Button onClick={handleSave} disabled={loading}>
              {loading ? t('common.saving') : t('common.save')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
