'use client'

import React from 'react'

import {
  Building2,
  CreditCard,
  LogOut,
  Settings,
  Shield,
  User,
  Users,
} from 'lucide-react'
import Link from 'next/link'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { useTranslation } from '@/context/i18n-context'
import { useAuth } from '@/hooks/use-auth'

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
  const { t } = useTranslation()
  const { signOut, user } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    // The auth context and page guard will handle redirection
  }

  if (!user) {
    return (
      <Button asChild variant={variant} size={size} className={className}>
        <Link href="/login" data-testid="login-link">
          {t('topNav.login')}
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
                className={`relative rounded-full hover:bg-green-600 hover:text-white transition-colors ${className}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-transparent">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
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
            <Link href="/preferences">
              <Settings className="mr-2 h-4 w-4" />
              {t('settings.preferences')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/company">
              <Building2 className="mr-2 h-4 w-4" />
              {t('settings.company')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/security">
              <Shield className="mr-2 h-4 w-4" />
              {t('settings.security')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/team">
              <Users className="mr-2 h-4 w-4" />
              {t('settings.manageTeam')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/subscription">
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
