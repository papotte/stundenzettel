'use client'

import Link from 'next/link'

import { useAuth } from '@/hooks/use-auth'

interface SmartLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  [key: string]: any // Allow other props to pass through
}

export default function SmartLink({
  href,
  children,
  className,
  ...props
}: SmartLinkProps) {
  const { user } = useAuth()

  // If user is logged in and trying to go to login page, redirect to tracker
  const finalHref = user && href === '/login' ? '/tracker' : href

  return (
    <Link href={finalHref} className={className} {...props}>
      {children}
    </Link>
  )
}
