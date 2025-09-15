'use client'

import { useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'

import { ArrowLeft, Building, Loader2, Save } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import PaywallWrapper from '@/components/paywall-wrapper'
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
import {
  getUserSettings,
  setUserSettings,
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
})

type CompanyFormValues = z.infer<typeof companyFormSchema>

export default function CompanyPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations()

  const [pageLoading, setPageLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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
          const settings = await getUserSettings(user.uid)
          form.reset({
            companyName: settings.companyName || '',
            companyEmail: settings.companyEmail || '',
            companyPhone1: settings.companyPhone1 || '',
            companyPhone2: settings.companyPhone2 || '',
            companyFax: settings.companyFax || '',
            driverCompensationPercent:
              settings.driverCompensationPercent || 100,
            passengerCompensationPercent:
              settings.passengerCompensationPercent || 90,
          })
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
    <div className="min-h-screen bg-muted p-4 sm:p-8 pb-20 md:pb-8">
      <div className="mx-auto max-w-2xl">
        <Button asChild variant="outline" className="mb-8">
          <Link href="/tracker">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('settings.backToTracker')}
          </Link>
        </Button>
        
        <PaywallWrapper 
          feature="companySettings"
          title={t('paywall.companySettings.title')}
          description={t('paywall.companySettings.description')}
        >
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
                              placeholder={t('settings.companyPhone1Placeholder')}
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
                              placeholder={t('settings.companyPhone2Placeholder')}
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
        </PaywallWrapper>
      </div>
    </div>
  )
}
