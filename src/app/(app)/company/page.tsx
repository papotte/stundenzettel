'use client'

import { useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'

import { Building, FileSpreadsheet, Loader2, Percent, Save } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { LockedByTeamAlert } from '@/components/locked-by-team-alert'
import SubscriptionGuard from '@/components/subscription-guard'
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
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import {
  useInvalidateUserSettings,
  useUserSettings,
} from '@/hooks/use-user-settings'
import { getUserTeamMembership } from '@/services/team-service'
import {
  setUserSettings,
  stripReadOnlySettingsFields,
} from '@/services/user-settings-service'

const companyFormSchema = z.object({
  companyName: z.string().optional(),
  companyEmail: z.string().email().optional().or(z.literal('')),
  companyPhone1: z.string().optional(),
  companyPhone2: z.string().optional(),
  companyFax: z.string().optional(),
  driverCompensationPercent: z.coerce.number().int().min(0).max(100).optional(),
  passengerCompensationPercent: z.coerce
    .number()
    .int()
    .min(0)
    .max(100)
    .optional(),
  exportIncludeDriverTime: z.boolean(),
  exportIncludePassengerTime: z.boolean(),
})

type CompanyFormValues = z.infer<typeof companyFormSchema>

export default function CompanyPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations()
  const {
    data: settings,
    isPending: settingsPending,
    isError: settingsError,
  } = useUserSettings()
  const invalidateUserSettings = useInvalidateUserSettings()

  const [isSaving, setIsSaving] = useState(false)
  const [canManageTeamOptions, setCanManageTeamOptions] = useState(false)

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    mode: 'all',
    defaultValues: {
      companyName: '',
      companyEmail: '',
      companyPhone1: '',
      companyPhone2: '',
      companyFax: '',
      driverCompensationPercent: 100,
      passengerCompensationPercent: 100,
      exportIncludeDriverTime: true,
      exportIncludePassengerTime: true,
    },
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?returnUrl=/company')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!settings) return
    form.reset({
      companyName: settings.companyName || '',
      companyEmail: settings.companyEmail || '',
      companyPhone1: settings.companyPhone1 || '',
      companyPhone2: settings.companyPhone2 || '',
      companyFax: settings.companyFax || '',
      driverCompensationPercent: settings.driverCompensationPercent || 100,
      passengerCompensationPercent:
        settings.passengerCompensationPercent || 100,
      exportIncludeDriverTime: settings.exportIncludeDriverTime !== false,
      exportIncludePassengerTime: settings.exportIncludePassengerTime !== false,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, form.reset])

  useEffect(() => {
    if (!settingsError) return
    toast({
      title: t('settings.errorLoadingTitle'),
      description: t('settings.errorLoadingDescription'),
      variant: 'destructive',
    })
  }, [settingsError, t, toast])

  useEffect(() => {
    let cancelled = false
    const loadMembership = async () => {
      if (!user?.uid) {
        if (!cancelled) setCanManageTeamOptions(false)
        return
      }
      try {
        const membership = await getUserTeamMembership(user.uid)
        const canManage =
          membership?.role === 'owner' || membership?.role === 'admin'
        if (!cancelled) setCanManageTeamOptions(canManage)
      } catch {
        if (!cancelled) setCanManageTeamOptions(false)
      }
    }
    void loadMembership()
    return () => {
      cancelled = true
    }
  }, [user?.uid])

  const compensationLocked = Boolean(settings?.locked?.compensation)
  const exportLocked = Boolean(settings?.locked?.export)

  const onSubmit = async (data: CompanyFormValues) => {
    if (!user || !settings) return
    setIsSaving(true)
    try {
      const base = stripReadOnlySettingsFields(settings)
      await setUserSettings(user.uid, { ...base, ...data })
      await invalidateUserSettings(user.uid)
      toast({
        title: t('settings.savedTitle'),
        description: t('settings.savedDescription'),
      })
    } catch (error) {
      console.error('Failed to save company settings', error)
      toast({
        title: t('settings.errorSavingTitle'),
        description: t('settings.errorSavingDescription'),
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || (user && settingsPending)) {
    return (
      <div className="min-h-screen bg-muted p-4 sm:p-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SubscriptionGuard>
      <div className="min-h-screen bg-muted p-4 sm:p-8 pb-20 md:pb-8">
        <div className="mx-auto max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {t('settings.company')}
                  </CardTitle>
                  <CardDescription>
                    {t('settings.companyDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.companyName')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('settings.companyNamePlaceholder')}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('settings.companyNameDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.companyEmail')}</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={t('settings.companyEmailPlaceholder')}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('settings.companyEmailDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="companyPhone1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.companyPhone1')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t(
                                'settings.companyPhone1Placeholder',
                              )}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyPhone2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.companyPhone2')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t(
                                'settings.companyPhone2Placeholder',
                              )}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="companyFax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.companyFax')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('settings.companyFaxPlaceholder')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    {t('settings.compensationSettings')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {compensationLocked ? (
                    <LockedByTeamAlert showChangeText={canManageTeamOptions} />
                  ) : null}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="driverCompensationPercent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('settings.driverCompensationPercent')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="200"
                              step="0.1"
                              readOnly={compensationLocked}
                              className={
                                compensationLocked
                                  ? 'cursor-not-allowed bg-muted'
                                  : undefined
                              }
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            {t('settings.driverCompensationPercentDescription')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="passengerCompensationPercent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('settings.passengerCompensationPercent')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="200"
                              step="0.1"
                              readOnly={compensationLocked}
                              className={
                                compensationLocked
                                  ? 'cursor-not-allowed bg-muted'
                                  : undefined
                              }
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            {t(
                              'settings.passengerCompensationPercentDescription',
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    {t('settings.exportSettings')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {exportLocked ? (
                    <LockedByTeamAlert showChangeText={canManageTeamOptions} />
                  ) : null}

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="exportIncludeDriverTime"
                      render={({ field }) => (
                        <FormItem className="flex items-start justify-between gap-4">
                          <div className="space-y-0.5">
                            <FormLabel>
                              {t('settings.exportIncludeDriverTime')}
                            </FormLabel>
                            <FormDescription>
                              {t('settings.exportIncludeDriverTimeDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={exportLocked}
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
                        <FormItem className="flex items-start justify-between gap-4">
                          <div className="space-y-0.5">
                            <FormLabel>
                              {t('settings.exportIncludePassengerTime')}
                            </FormLabel>
                            <FormDescription>
                              {t(
                                'settings.exportIncludePassengerTimeDescription',
                              )}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={exportLocked}
                              className="shrink-0"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full"
                data-testid="saveButton"
              >
                {isSaving ? (
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    data-testid="loader-icon"
                  />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isSaving ? t('common.saving') : t('common.save')}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </SubscriptionGuard>
  )
}
