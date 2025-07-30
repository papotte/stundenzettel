'use client'

import React, { useEffect, useId, useState, useTransition } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'

import { ArrowLeft, Loader2, Save, Settings } from 'lucide-react'
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
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
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
    .max(10, 'Cannot be more than 10 hours'),
  defaultStartTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  defaultEndTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  language: z.enum(['en', 'de']),
})

type PreferencesFormValues = z.infer<typeof preferencesFormSchema>

export default function PreferencesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations()
  const language = useLocale()
  const [pageLoading, setPageLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const languageFieldId = useId()
  const [_, startTransition] = useTransition()

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    mode: 'all',
    defaultValues: {
      defaultWorkHours: 7,
      defaultStartTime: '09:00',
      defaultEndTime: '17:00',
      language: language,
      displayName: '',
    },
  })

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
      startTransition(() => {
        setUserLocale(data.language)
      })
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
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {t('settings.defaultWorkHoursDescription')}
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
