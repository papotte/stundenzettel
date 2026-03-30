'use client'

import { useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'

import { Loader2, Save } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import type { TeamSettings } from '@/lib/types'
import {
  getTeamSettings,
  setTeamSettings,
} from '@/services/team-settings-service'

const teamOptionsSchema = z.object({
  defaultDriverCompensationPercent: z
    .number({ coerce: true })
    .min(0, 'Must be at least 0')
    .max(200, 'Cannot be more than 200'),
  defaultPassengerCompensationPercent: z
    .number({ coerce: true })
    .min(0, 'Must be at least 0')
    .max(200, 'Cannot be more than 200'),
  allowMemberOverrideCompensation: z.boolean(),
  exportIncludeDriverTime: z.boolean(),
  exportIncludePassengerTime: z.boolean(),
  allowMemberOverrideExport: z.boolean(),
})

type TeamOptionsCardValues = z.infer<typeof teamOptionsSchema>

interface TeamOptionsCardProps {
  teamId: string
  canEdit: boolean
}

export function TeamOptionsCard({ teamId, canEdit }: TeamOptionsCardProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const [pageLoading, setPageLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<TeamOptionsCardValues>({
    resolver: zodResolver(teamOptionsSchema),
    defaultValues: {
      defaultDriverCompensationPercent: 100,
      defaultPassengerCompensationPercent: 90,
      allowMemberOverrideCompensation: true,
      exportIncludeDriverTime: true,
      exportIncludePassengerTime: true,
      allowMemberOverrideExport: true,
    },
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings: TeamSettings = await getTeamSettings(teamId)
        form.reset({
          defaultDriverCompensationPercent:
            settings.defaultDriverCompensationPercent ?? 100,
          defaultPassengerCompensationPercent:
            settings.defaultPassengerCompensationPercent ?? 90,
          allowMemberOverrideCompensation:
            settings.allowMemberOverrideCompensation ?? true,
          exportIncludeDriverTime: settings.exportIncludeDriverTime ?? true,
          exportIncludePassengerTime:
            settings.exportIncludePassengerTime ?? true,
          allowMemberOverrideExport: settings.allowMemberOverrideExport ?? true,
        })
      } catch {
        toast({
          title: t('common.error'),
          description: t('teams.failedToLoadTeamSettings'),
          variant: 'destructive',
        })
      } finally {
        setPageLoading(false)
      }
    }
    fetchSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId])

  const onSubmit = async (data: TeamOptionsCardValues) => {
    if (!canEdit) return
    setIsSaving(true)
    try {
      await setTeamSettings(teamId, data)
      toast({
        title: t('teams.teamSettingsSaved'),
        description: t('teams.teamSettingsSavedDescription'),
      })
    } catch {
      toast({
        title: t('common.error'),
        description: t('teams.failedToSaveTeamSettings'),
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (pageLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('teams.teamWideSettings')}</CardTitle>
          <CardDescription>
            {t('teams.teamWideSettingsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('teams.teamWideSettings')}</CardTitle>
        <CardDescription>
          {t('teams.teamWideSettingsDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
            <section
              className="space-y-4"
              aria-labelledby="team-options-compensation-heading"
            >
              <div className="space-y-1">
                <h3
                  id="team-options-compensation-heading"
                  className="text-base font-semibold leading-none tracking-tight"
                >
                  {t('teams.compensationDefaults')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('teams.compensationDefaultsDescription')}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="defaultDriverCompensationPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('teams.teamDefaultDriverCompensation')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          disabled={!canEdit}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('teams.teamDefaultDriverCompensationDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultPassengerCompensationPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('teams.teamDefaultPassengerCompensation')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          disabled={!canEdit}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('teams.teamDefaultPassengerCompensationDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="allowMemberOverrideCompensation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start justify-between gap-4 py-1">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <FormLabel>
                        {t('teams.allowMemberOverrideCompensation')}
                      </FormLabel>
                      <FormDescription>
                        {t('teams.allowMemberOverrideCompensationDescription')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!canEdit}
                        className="shrink-0"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </section>

            <section
              className="space-y-4"
              aria-labelledby="team-options-export-heading"
            >
              <div className="space-y-1">
                <h3
                  id="team-options-export-heading"
                  className="text-base font-semibold leading-none tracking-tight"
                >
                  {t('teams.exportDefaults')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('teams.exportDefaultsDescription')}
                </p>
              </div>
              <div className="space-y-1">
                <FormField
                  control={form.control}
                  name="exportIncludeDriverTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start justify-between gap-4 py-3">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <FormLabel>
                          {t('teams.exportIncludeDriverTime')}
                        </FormLabel>
                        <FormDescription>
                          {t('teams.exportIncludeDriverTimeDescription')}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canEdit}
                          className="shrink-0"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="exportIncludePassengerTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start justify-between gap-4 py-3">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <FormLabel>
                          {t('teams.exportIncludePassengerTime')}
                        </FormLabel>
                        <FormDescription>
                          {t('teams.exportIncludePassengerTimeDescription')}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canEdit}
                          className="shrink-0"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="allowMemberOverrideExport"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start justify-between gap-4 py-3">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <FormLabel>
                          {t('teams.allowMemberOverrideExport')}
                        </FormLabel>
                        <FormDescription>
                          {t('teams.allowMemberOverrideExportDescription')}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canEdit}
                          className="shrink-0"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {canEdit ? (
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                  data-testid="saveTeamSettingsButton"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {isSaving ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            ) : null}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
