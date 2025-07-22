'use client'

import React, { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'

import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useTranslation } from '@/context/i18n-context'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { sendPasswordChangeNotification } from '@/services/email-notification-service'
import { updateUserPassword } from '@/services/password-update-service'

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  })

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>

interface PasswordChangeDialogProps {
  children: React.ReactNode
}

export default function PasswordChangeDialog({
  children,
}: PasswordChangeDialogProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const form = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: PasswordChangeFormData) => {
    if (!user) {
      toast({
        title: t('settings.error'),
        description: 'User not authenticated',
        variant: 'destructive',
      })
      return
    }

    setIsUpdating(true)
    try {
      await updateUserPassword(user.uid, data.currentPassword, data.newPassword)

      // Send email notification after successful password change
      try {
        await sendPasswordChangeNotification(user.email, user.displayName)
      } catch (emailError) {
        // Don't fail the entire operation if email sending fails
        console.error(
          'Failed to send password change notification:',
          emailError,
        )
      }

      toast({
        title: t('settings.passwordUpdated'),
        description: t('settings.passwordUpdatedDescription'),
      })

      // Reset form and close dialog
      form.reset()
      setIsOpen(false)
    } catch (error) {
      console.error('Password update failed:', error)
      let errorMessage = t('settings.passwordUpdateError')

      if (error instanceof Error) {
        if (
          error.message.includes('password') ||
          error.message.includes('credential') ||
          error.message.includes('Invalid password')
        ) {
          errorMessage = t('settings.passwordUpdateInvalidCurrent')
        } else if (error.message.includes('8 characters')) {
          errorMessage = t('settings.passwordTooShort')
        }
      }

      toast({
        title: t('settings.error'),
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDialogClose = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Reset form when dialog closes
      form.reset()
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('settings.changePasswordTitle')}</DialogTitle>
          <DialogDescription>
            {t('settings.changePasswordDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.currentPasswordLabel')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder={t('settings.currentPasswordPlaceholder')}
                        disabled={isUpdating}
                        data-testid="current-password-input"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        disabled={isUpdating}
                        data-testid="toggle-current-password"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.newPasswordLabel')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder={t('settings.newPasswordPlaceholder')}
                        disabled={isUpdating}
                        data-testid="new-password-input"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        disabled={isUpdating}
                        data-testid="toggle-new-password"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.confirmPasswordLabel')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder={t('settings.confirmPasswordPlaceholder')}
                        disabled={isUpdating}
                        data-testid="confirm-password-input"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        disabled={isUpdating}
                        data-testid="toggle-confirm-password"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-sm text-muted-foreground">
              {t('settings.passwordRequirements')}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogClose(false)}
                disabled={isUpdating}
                data-testid="cancel-button"
              >
                {t('settings.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                data-testid="change-password-button"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('settings.updating')}
                  </>
                ) : (
                  t('settings.change')
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
