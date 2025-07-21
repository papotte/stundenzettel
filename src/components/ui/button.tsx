import * as React from 'react'
import { useEffect, useState } from 'react'

import { Slot } from '@radix-ui/react-slot'

import { type VariantProps, cva } from 'class-variance-authority'

import { ProBadge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { subscriptionService } from '@/services/subscription-service'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

// Button that is only enabled for subscribed users, shows ProBadge if not
export function SubscriptionGuardButton({ children, ...props }: ButtonProps) {
  const { user } = useAuth()
  const [hasValidSubscription, setHasValidSubscription] = useState<
    boolean | null
  >(null)

  useEffect(() => {
    let mounted = true
    async function check() {
      if (!user) {
        if (mounted) setHasValidSubscription(false)
        return
      }
      const sub = await subscriptionService.getUserSubscription(user.uid)
      if (mounted)
        setHasValidSubscription(
          sub && (sub.status === 'active' || sub.status === 'trialing'),
        )
    }
    check()
    return () => {
      mounted = false
    }
  }, [user])

  // While loading, disable button
  const disabled =
    hasValidSubscription === null || !hasValidSubscription || props.disabled

  return (
    <Button {...props} disabled={disabled}>
      {children}
      {!hasValidSubscription && <ProBadge className="ml-2" />}
    </Button>
  )
}

export { Button, buttonVariants }
