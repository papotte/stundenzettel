'use client'

import React, { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'

import { Loader2 } from 'lucide-react'
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
import { PasswordInput } from '@/components/ui/password-input'
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
      .min(8, 'Password must be at least 8 characters long')
      .max(4096, 'Password must be at most 4096 characters long')
      .regex(/[A-Z]/, 'Password must contain an uppercase character')
      .regex(/[a-z]/, 'Password must contain a lowercase character')
      .regex(/[0-9]/, 'Password must contain a numeric character')
      .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
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
        description: t('settings.userNotAuthenticated'),
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
        // Check for authentication/credential errors (wrong current password)
        if (
          error.message.includes('credential') ||
          error.message.includes('Invalid password') ||
          error.message.includes('wrong-password') ||
          error.message.includes('auth/wrong-password') ||
          error.message.includes('auth/invalid-credential')
        ) {
          errorMessage = t('settings.passwordUpdateInvalidCurrent')
        } 
        // Check for password validation errors (new password doesn't meet requirements)
        else if (error.message.includes('PASSWORD_DOES_NOT_MEET_REQUIREMENTS')) {
          errorMessage = t('settings.passwordUpdateError')
        }
        // Check for minimum length errors
        else if (error.message.includes('8 characters')) {
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
                    <PasswordInput
                      field={field}
                      placeholder={t('settings.currentPasswordPlaceholder')}
                      disabled={isUpdating}
                      showPassword={showCurrentPassword}
                      onToggleVisibility={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      data-testid="current-password-input"
                      toggleTestId="toggle-current-password"
                    />
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
                    <PasswordInput
                      field={field}
                      placeholder={t('settings.newPasswordPlaceholder')}
                      disabled={isUpdating}
                      showPassword={showNewPassword}
                      onToggleVisibility={() => setShowNewPassword(!showNewPassword)}
                      data-testid="new-password-input"
                      toggleTestId="toggle-new-password"
                    />
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
                    <PasswordInput
                      field={field}
                      placeholder={t('settings.confirmPasswordPlaceholder')}
                      disabled={isUpdating}
                      showPassword={showConfirmPassword}
                      onToggleVisibility={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      data-testid="confirm-password-input"
                      toggleTestId="toggle-confirm-password"
                    />
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
