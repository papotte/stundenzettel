'use client'

import { ProBadge } from '@/components/ui/badge'
import { Button, type ButtonProps } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useSubscriptionStatus } from '@/hooks/use-subscription-status'
import { cn } from '@/lib/utils'

// Button that is only enabled for subscribed users, shows ProBadge if not
export function SubscriptionGuardButton({
  children,
  className,
  ...props
}: ButtonProps) {
  const { user } = useAuth()
  const { hasValidSubscription } = useSubscriptionStatus(user)

  const disabled =
    hasValidSubscription === null ||
    !hasValidSubscription ||
    props.disabled

  const wrapperClassName = cn('relative inline-flex', className)
  const innerClassName =
    props.asChild && disabled ? 'opacity-50 pointer-events-none' : undefined

  return (
    <span className={wrapperClassName}>
      <Button {...props} className={innerClassName} disabled={disabled}>
        {children}
      </Button>
      {!hasValidSubscription && (
        <a
          href="/subscription"
          aria-label="Manage subscription"
          className="absolute -top-1 -right-1"
          onClick={(e) => e.stopPropagation()}
        >
          <ProBadge />
        </a>
      )}
    </span>
  )
}
