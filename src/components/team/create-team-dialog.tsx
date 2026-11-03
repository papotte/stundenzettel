'use client'

import { useState } from 'react'

import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCreateTeam } from '@/hooks/use-team'
import { useToast } from '@/hooks/use-toast'
import { useZodForm } from '@/hooks/use-zod-form'
import { paymentService } from '@/services/payment-service'

type TeamFormValues = {
  name: string
  description?: string
}

interface CreateTeamDialogProps {
  userId: string
  userEmail: string
}

export function CreateTeamDialog({ userId, userEmail }: CreateTeamDialogProps) {
  const [open, setOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()
  const t = useTranslations()
  const createTeamMutation = useCreateTeam(userId)

  const form = useZodForm(
    z.object({
      name: z.string().min(1, t('teams.teamNameRequired')),
      description: z.string().optional(),
    }),
    {
      defaultValues: {
        name: '',
        description: '',
      },
    },
  )

  const onSubmit = async (values: TeamFormValues) => {
    setIsCreating(true)
    try {
      const teamId = await createTeamMutation.mutateAsync({
        name: values.name,
        description: values.description || '',
        ownerEmail: userEmail,
      })

      // Sync team with Stripe
      try {
        await paymentService.syncTeamWithStripe(userEmail, userId, teamId)
      } catch (error) {
        // Log error but don't fail team creation
        console.error('Failed to sync team with Stripe:', error)
      }

      setOpen(false)
      form.reset()

      toast({
        title: t('teams.teamCreated'),
        description: t('teams.teamCreatedDescription', { name: values.name }),
      })
    } catch (error) {
      toast({
        title: t('common.error'),
        description:
          error instanceof Error
            ? error.message
            : t('teams.failedToCreateTeam'),
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          {t('teams.createTeam')}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-106.25"
        data-testid="create-team-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t('teams.createTeam')}</DialogTitle>
          <DialogDescription>{t('teams.subtitle')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('teams.teamName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('teams.teamNamePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('teams.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('teams.descriptionPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? t('common.creating') : t('teams.createTeam')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
