'use client'

import { useState } from 'react'

import { UserPlus } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateInvitation } from '@/hooks/use-team'
import { useToast } from '@/hooks/use-toast'
import { useZodForm } from '@/hooks/use-zod-form'

type InviteFormValues = {
  email: string
  role: 'admin' | 'member'
}

interface InviteMemberDialogProps {
  teamId: string
  invitedBy: string
}

export function InviteMemberDialog({
  teamId,
  invitedBy,
}: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()
  const t = useTranslations()
  const createInvitationMutation = useCreateInvitation(invitedBy, teamId)

  const form = useZodForm(
    z.object({
      email: z.email(t('teams.pleaseEnterValidEmail')),
      role: z.enum(['admin', 'member'], {
        error: t('teams.pleaseSelectRole'),
      }),
    }),
    {
      defaultValues: {
        email: '',
        role: 'member',
      },
    },
  )

  const onSubmit = async (values: InviteFormValues) => {
    setIsSending(true)
    try {
      await createInvitationMutation.mutateAsync({
        email: values.email,
        role: values.role,
        invitedBy,
      })

      setOpen(false)
      form.reset()

      toast({
        title: t('teams.invitationSent'),
        description: t('teams.invitationSentDescription', {
          email: values.email,
        }),
      })
    } catch (error) {
      toast({
        title: t('common.error'),
        description:
          error instanceof Error
            ? error.message
            : t('teams.failedToSendInvitation'),
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 size-4" />
          {t('teams.inviteMember')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{t('teams.inviteMemberTitle')}</DialogTitle>
          <DialogDescription>
            {t('teams.inviteMemberDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('teams.emailAddress')}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t('teams.emailPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('teams.role')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('teams.rolePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">
                        {t('teams.member')}
                      </SelectItem>
                      <SelectItem value="admin">{t('teams.admin')}</SelectItem>
                    </SelectContent>
                  </Select>
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
              <Button type="submit" disabled={isSending}>
                {isSending ? t('teams.sending') : t('teams.sendInvitation')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
