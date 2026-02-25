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
  CardFooter,
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

const teamWideSettingsSchema = z.object({
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

type TeamWideSettingsFormValues = z.infer<typeof teamWideSettingsSchema>

interface TeamWideSettingsFormProps {
  teamId: string
  canEdit: boolean
}

export function TeamWideSettingsForm({
  teamId,
  canEdit,
}: TeamWideSettingsFormProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const [pageLoading, setPageLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<TeamWideSettingsFormValues>({
    resolver: zodResolver(teamWideSettingsSchema),
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

  const onSubmit = async (data: TeamWideSettingsFormValues) => {
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
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Compensation Defaults */}
        <Card>
          <CardHeader>
            <CardTitle>{t('teams.compensationDefaults')}</CardTitle>
            <CardDescription>
              {t('teams.compensationDefaultsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
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
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Export Defaults */}
        <Card>
          <CardHeader>
            <CardTitle>{t('teams.exportDefaults')}</CardTitle>
            <CardDescription>
              {t('teams.exportDefaultsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="exportIncludeDriverTime"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t('teams.exportIncludeDriverTime')}</FormLabel>
                    <FormDescription>
                      {t('teams.exportIncludeDriverTimeDescription')}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!canEdit}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="exportIncludePassengerTime"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
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
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allowMemberOverrideExport"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
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
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          {canEdit && (
            <CardFooter>
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full"
                data-testid="saveTeamSettingsButton"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isSaving ? t('common.saving') : t('common.save')}
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>
    </Form>
  )
}
