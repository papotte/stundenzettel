'use client'

import { useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'

import { ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslation } from '@/context/i18n-context'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import {
  getUserSettings,
  setUserSettings,
} from '@/services/user-settings-service'

const settingsFormSchema = z.object({
  defaultWorkHours: z.coerce
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
  defaultIsDriver: z.boolean().optional(),
  displayName: z.string().optional(), // New
  companyName: z.string().optional(),
  companyEmail: z.string().email().optional().or(z.literal('')),
  companyPhone1: z.string().optional(),
  companyPhone2: z.string().optional(),
  companyFax: z.string().optional(),
})

type SettingsFormValues = z.infer<typeof settingsFormSchema>

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { t, setLanguageState, language } = useTranslation()
  const [pageLoading, setPageLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    mode: 'all',
    defaultValues: {
      defaultWorkHours: 7,
      defaultStartTime: '09:00',
      defaultEndTime: '17:00',
      language: language,
      defaultIsDriver: false,
      displayName: '', // New
      companyName: '',
      companyEmail: '',
      companyPhone1: '',
      companyPhone2: '',
      companyFax: '',
    },
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      const fetchSettings = async () => {
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
      fetchSettings()
    }
    // Only depend on user and form.reset to avoid unnecessary resets
  }, [user, form.reset])

  const onSubmit = async (data: SettingsFormValues) => {
    if (!user) return
    setIsSaving(true)
    try {
      await setUserSettings(user.uid, data)
      setLanguageState(data.language)
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
        <div className="mx-auto max-w-xl">
          <Skeleton className="mb-8 h-10 w-32" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="mt-2 h-4 w-full max-w-sm" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
              <Skeleton className="h-14 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-24" />
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-muted p-4 sm:p-8">
      <div className="mx-auto max-w-xl">
        <Button
          asChild
          variant="outline"
          className="mb-8 hidden md:inline-flex"
        >
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('settings.backButton')}
          </Link>
        </Button>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.title')}</CardTitle>
                <CardDescription>{t('settings.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="defaultWorkHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('settings.defaultWorkHoursLabel')}
                      </FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" {...field} />
                      </FormControl>
                      <FormMessage />
                      <p className="pt-1 text-sm text-muted-foreground">
                        {t('settings.defaultWorkHoursDescription')}
                      </p>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultIsDriver"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-4 mb-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          id="defaultIsDriver"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel htmlFor="defaultIsDriver">
                          {t('settings.defaultIsDriverLabel')}
                        </FormLabel>
                        <FormDescription>
                          {t('settings.defaultIsDriverDescription')}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel>{t('settings.displayNameLabel')}</FormLabel>
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
                    )
                  }}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="defaultStartTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('settings.defaultStartTimeLabel')}
                        </FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormDescription>
                          {t('settings.timeUsageDescription')}
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
                        <FormLabel>
                          {t('settings.defaultEndTimeLabel')}
                        </FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormDescription>
                          {t('settings.timeUsageDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.languageLabel')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">
                            {t('settings.languageEnglish')}
                          </SelectItem>
                          <SelectItem value="de">
                            {t('settings.languageGerman')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t('settings.languageDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardContent>
                <Separator />
              </CardContent>
              <CardHeader className="pt-0">
                <CardTitle>{t('settings.companyDetailsTitle')}</CardTitle>
                <CardDescription>
                  {t('settings.companyDetailsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.companyNameLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder="TimeWise Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.companyEmailLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder="info@timewise.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="companyPhone1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('settings.companyPhone1Label')}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. +49 123 456789" {...field} />
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
                        <FormLabel>
                          {t('settings.companyPhone2Label')}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. +49 987 654321" {...field} />
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
                      <FormLabel>{t('settings.companyFaxLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. +49 123 456780" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {t('settings.saveButton')}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  )
}
