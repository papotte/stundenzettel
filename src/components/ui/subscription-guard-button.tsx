'use client'

import { ProBadge } from '@/components/ui/badge'
import { Button, type ButtonProps } from '@/components/ui/button'
import { useSubscriptionContext } from '@/context/subscription-context'
import { cn } from '@/lib/utils'

// Button that is only enabled for subscribed users, shows ProBadge if not
export function SubscriptionGuardButton({
  children,
  className,
  ...props
}: ButtonProps) {
  const { hasValidSubscription, loading } = useSubscriptionContext()

  const disabled =
    loading ||
    hasValidSubscription === null ||
    !hasValidSubscription ||
    props.disabled

  const disabledClasses = disabled
    ? 'opacity-50 pointer-events-none'
    : undefined
  const buttonClassName = cn(
    props.asChild,
    disabledClasses,
    className,
    'relative',
  )

  return (
    <Button
      {...props}
      className={buttonClassName}
      disabled={disabled}
      variant="nav"
    >
      {children}{' '}
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
    </Button>
  )
}
