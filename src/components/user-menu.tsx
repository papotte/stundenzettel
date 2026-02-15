'use client'

import {
  Building2,
  CreditCard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Users,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

import { Badge, ProBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSubscriptionContext } from '@/context/subscription-context'
import { useAuth } from '@/hooks/use-auth'
import { useUserInvitations } from '@/hooks/use-user-invitations'

interface UserMenuProps {
  variant?: 'default' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export default function UserMenu({
  variant = 'ghost',
  size = 'icon',
  className = '',
}: UserMenuProps) {
  const t = useTranslations()
  const { signOut, user } = useAuth()
  const { hasValidSubscription } = useSubscriptionContext()
  const { hasPendingInvitations, invitations } = useUserInvitations()

  const handleSignOut = async () => {
    await signOut()
    // The auth context and page guard will handle redirection
  }

  if (!user) {
    return (
      <Button
        asChild
        variant={variant}
        size={size}
        className={`w-auto px-2 ${className}`}
      >
        <Link href="/login" data-testid="login-link">
          {t('nav.top.login')}
        </Link>
      </Button>
    )
  }

  return (
    <TooltipProvider>
      <DropdownMenu data-testid="user-menu-dropdown">
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                data-testid="user-menu-btn"
                variant={variant}
                size={size}
                className={`rounded-md hover:bg-green-600 hover:text-white transition-colors ${className}`}
              >
                <Menu className="h-6 w-6" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('tracker.headerUserMenuTooltip')}</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user?.displayName || user?.email}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/preferences" data-testid="preferences">
              <Settings className="mr-2 h-4 w-4" />
              {t('settings.preferences')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/company" data-testid="company">
              <Building2 className="mr-2 h-4 w-4" />
              <span className="flex flex-grow">{t('settings.company')}</span>
              {!hasValidSubscription && <ProBadge className="ml-2" />}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/security" data-testid="security">
              <Shield className="mr-2 h-4 w-4" />
              {t('settings.security')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/team" data-testid="team">
              <Users className="mr-2 h-4 w-4" />
              <span className="flex flex-grow">{t('settings.manageTeam')}</span>
              {hasPendingInvitations && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-5 min-w-[20px] px-0 text-xs justify-center"
                >
                  {invitations.length > 9 ? '9+' : invitations.length}
                </Badge>
              )}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/subscription" data-testid="subscription">
              <CreditCard className="mr-2 h-4 w-4" />
              {t('settings.manageSubscription')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} data-testid="sign-out-btn">
            <LogOut className="mr-2 h-4 w-4" />
            {t('tracker.headerSignOutTooltip')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}
