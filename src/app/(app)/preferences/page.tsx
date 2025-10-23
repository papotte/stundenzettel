'use client'

import React, { useEffect, useId, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'

import { ArrowLeft, InfoIcon, Loader2, Save, Settings } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import LanguageSelect from '@/components/language-select'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { locales } from '@/i18n'
import { calculateExpectedMonthlyHours } from '@/lib/time-utils'
import { setUserLocale } from '@/services/locale'
import {
  getUserSettings,
  setUserSettings,
} from '@/services/user-settings-service'

const preferencesFormSchema = z.object({
  displayName: z.string().optional(),
  defaultWorkHours: z
    .number()
    .min(1, 'Must be at least 1 hour')
    .max(10, 'Cannot be more than 10 hours')
    .optional(),
  expectedMonthlyHours: z
    .number()
    .min(1, 'Must be at least 1 hour')
    .max(500, 'Cannot be more than 500 hours')
    .optional(),
  defaultStartTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  defaultEndTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  language: z.enum(locales),
})

type PreferencesFormValues = z.infer<typeof preferencesFormSchema>

export default function PreferencesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations()
  const language: string = useLocale()
  const [pageLoading, setPageLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const languageFieldId = useId()

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    mode: 'all',
    defaultValues: {
      defaultWorkHours: 7,
      expectedMonthlyHours: 160,
      defaultStartTime: '09:00',
      defaultEndTime: '17:00',
      language: language,
      displayName: '',
    },
  })

  // Watch defaultWorkHours to auto-calculate expectedMonthlyHours
  const defaultWorkHours = form.watch('defaultWorkHours')

  useEffect(() => {
    // Only calculate when user manually changes defaultWorkHours (not during initial load)
    if (defaultWorkHours && !pageLoading) {
      // Use the utility function to calculate expected monthly hours
      const calculated = calculateExpectedMonthlyHours({ defaultWorkHours })
      form.setValue('expectedMonthlyHours', calculated)
    }
  }, [defaultWorkHours, form, pageLoading])

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?returnUrl=/preferences')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const settings = await getUserSettings(user.uid)
          form.reset(settings)
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

  const onSubmit = async (data: PreferencesFormValues) => {
    if (!user) return
    setIsSaving(true)
    try {
      await setUserSettings(user.uid, data)
      await setUserLocale(data.language)

      // Update Resend contact if displayName is provided
      if (data.displayName && user.email) {
        try {
          await fetch('/api/contacts/update', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              firstName: data.displayName,
            }),
          })
        } catch (resendError) {
          // Log the error but don't fail the entire operation
          console.warn('Failed to update Resend contact:', resendError)
        }
      }

      toast({
        title: t('settings.savedTitle'),
        description: t('settings.savedDescription'),
      })
    } catch (error) {
      console.error('Failed to save user settings', error)
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
                  <Settings className="h-5 w-5" />
                  {t('settings.preferences')}
                </CardTitle>
                <CardDescription>
                  {t('settings.preferencesDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.displayName')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('settings.displayNamePlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('settings.displayNameDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor={languageFieldId}>
                        {t('settings.language')}
                      </FormLabel>
                      <FormControl>
                        <LanguageSelect
                          value={field.value}
                          onChange={field.onChange}
                          id={languageFieldId}
                          className={'w-full'}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('settings.languageDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultWorkHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.defaultWorkHours')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value
                            field.onChange(value ? Number(value) : undefined)
                          }}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('settings.defaultWorkHoursDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expectedMonthlyHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t('settings.expectedMonthlyHours')}
                        {defaultWorkHours && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <InfoIcon className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  {t('settings.expectedMonthlyHoursTooltip')}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value
                            field.onChange(value ? Number(value) : undefined)
                          }}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>
                        {defaultWorkHours
                          ? t('settings.expectedMonthlyHoursDescriptionAuto', {
                              hours: defaultWorkHours,
                            })
                          : t('settings.expectedMonthlyHoursDescriptionManual')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="defaultStartTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.defaultStartTime')}</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormDescription>
                          {t('settings.defaultStartTimeDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="defaultEndTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.defaultEndTime')}</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormDescription>
                          {t('settings.defaultEndTimeDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
