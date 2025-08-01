'use client'

import { useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'

import { ArrowLeft, Building, Loader2, Save, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import SubscriptionGuard from '@/components/subscription-guard'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import {
  getUserSettings,
  setUserSettings,
} from '@/services/user-settings-service'
import { getEffectiveUserSettings } from '@/services/team-settings-service'
import { getUserTeam } from '@/services/team-service'

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
})

type CompanyFormValues = z.infer<typeof companyFormSchema>

export default function CompanyPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations()

  const [pageLoading, setPageLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [overridePermissions, setOverridePermissions] = useState({
    canOverrideCompensation: true,
    canOverrideExportSettings: true,
    canOverrideWorkHours: true,
  })

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
      passengerCompensationPercent: 90,
    },
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?returnUrl=/company')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          // Get user's team to check for team settings
          const userTeam = await getUserTeam(user.uid)

          if (userTeam) {
            // User is part of a team, get effective settings with team overrides
            const { settings: effectiveSettings, overrides } = await getEffectiveUserSettings(user.uid, userTeam.id)
            setOverridePermissions(overrides)

            form.reset({
              companyName: effectiveSettings.companyName || '',
              companyEmail: effectiveSettings.companyEmail || '',
              companyPhone1: effectiveSettings.companyPhone1 || '',
              companyPhone2: effectiveSettings.companyPhone2 || '',
              companyFax: effectiveSettings.companyFax || '',
              driverCompensationPercent: effectiveSettings.driverCompensationPercent || 100,
              passengerCompensationPercent: effectiveSettings.passengerCompensationPercent || 90,
            })
          } else {
            // User is not part of a team, get individual settings
            const settings = await getUserSettings(user.uid)
            form.reset({
              companyName: settings.companyName || '',
              companyEmail: settings.companyEmail || '',
              companyPhone1: settings.companyPhone1 || '',
              companyPhone2: settings.companyPhone2 || '',
              companyFax: settings.companyFax || '',
              driverCompensationPercent: settings.driverCompensationPercent || 100,
              passengerCompensationPercent: settings.passengerCompensationPercent || 90,
            })
          }
        } catch (error) {
          console.error('Failed to fetch user settings', error)
          toast({
            title: t('settings.errorLoadingTitle'),
            description: t('settings.errorLoadingDescription'),
            variant: 'destructive',
          })
        } finally {
          setPageLoading(false)
        }
      }
      fetchData()
    }
    // Only depend on user and form.reset to avoid unnecessary resets
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, form.reset])

  const onSubmit = async (data: CompanyFormValues) => {
    if (!user) return
    setIsSaving(true)
    try {
      // Get current settings to preserve other fields
      const currentSettings = await getUserSettings(user.uid)
      const updatedSettings = {
        ...currentSettings,
        ...data,
      }
      await setUserSettings(user.uid, updatedSettings)
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

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-muted p-4 sm:p-8">
        <div className="mx-auto max-w-2xl">
          <Skeleton className="mb-8 h-10 w-32" />
          <Skeleton className="h-96 w-full" />
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
          <Button asChild variant="outline" className="mb-8">
            <Link href="/tracker">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('settings.backToTracker')}
            </Link>
          </Button>
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
                <CardContent>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">
                      {t('settings.compensationSettings')}
                    </h3>

                  {!overridePermissions.canOverrideCompensation && (
                    <Alert className="mb-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        {t('teams.settingsInheritedFromTeam')}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              disabled={!overridePermissions.canOverrideCompensation}
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            {!overridePermissions.canOverrideCompensation
                              ? t('teams.settingsOverriddenByTeam')
                              : t('settings.driverCompensationPercentDescription')}
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
                              disabled={!overridePermissions.canOverrideCompensation}
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            {!overridePermissions.canOverrideCompensation
                              ? t('teams.settingsOverriddenByTeam')
                              : t('settings.passengerCompensationPercentDescription')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
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
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  )
}
