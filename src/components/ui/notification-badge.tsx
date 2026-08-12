import * as React from 'react'

import { cn } from '@/lib/utils'

interface NotificationBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number
  showDot?: boolean
  variant?: 'default' | 'destructive' | 'warning'
  size?: 'sm' | 'md' | 'lg'
}

const notificationBadgeVariants = {
  variant: {
    default: 'bg-blue-500',
    destructive: 'bg-red-500',
    warning: 'bg-amber-500',
  },
  size: {
    sm: 'h-3 w-3 text-[10px]',
    md: 'h-4 w-4 text-xs',
    lg: 'h-5 w-5 text-sm',
  },
}

export function NotificationBadge({
  count,
  showDot = false,
  variant = 'destructive',
  size = 'md',
  className,
  ...props
}: NotificationBadgeProps) {
  const shouldShow = count !== undefined && count > 0

  if (!shouldShow && !showDot) {
    return null
  }

  return (
    <div
      className={cn(
        'absolute -top-1 -right-1 flex items-center justify-center rounded-full font-medium text-white',
        notificationBadgeVariants.variant[variant],
        notificationBadgeVariants.size[size],
        className,
      )}
      {...props}
    >
      {showDot ? (
        <div className="size-1.5 rounded-full bg-white" />
      ) : (
        <span>{count && count > 9 ? '9+' : count}</span>
      )}
    </div>
  )
}
