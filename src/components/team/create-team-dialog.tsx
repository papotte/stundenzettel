'use client'

import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'

import { Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
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
import { useTranslation } from '@/hooks/use-translation-compat'
import { useToast } from '@/hooks/use-toast'
import type { Team } from '@/lib/types'
import { createTeam, getTeam } from '@/services/team-service'

type TeamFormValues = {
  name: string
  description?: string
}

interface CreateTeamDialogProps {
  userId: string
  userEmail: string
  onTeamCreated: (team: Team) => void
}

export function CreateTeamDialog({
  userId,
  userEmail,
  onTeamCreated,
}: CreateTeamDialogProps) {
  const [open, setOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, t('teams.teamNameRequired')),
        description: z.string().optional(),
      }),
    ),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const onSubmit = async (values: TeamFormValues) => {
    setIsCreating(true)
    try {
      const teamId = await createTeam(
        values.name,
        values.description || '',
        userId,
        userEmail,
      )
      const team = await getTeam(teamId)

      if (team) {
        onTeamCreated(team)
        setOpen(false)
        form.reset()

        toast({
          title: t('teams.teamCreated'),
          description: t('teams.teamCreatedDescription', { name: team.name }),
        })
      }
    } catch (error) {
      toast({
        title: t('teams.error'),
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
          <Plus className="mr-2 h-4 w-4" />
          {t('teams.createTeam')}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
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
                {isCreating ? t('teams.creating') : t('teams.createTeam')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
