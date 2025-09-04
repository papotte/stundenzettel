import React from 'react'

import { FileSpreadsheet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

import TimeWiseIcon from './time-wise-icon'
import UserMenu from './user-menu'

const TimeTrackerHeader: React.FC = () => {
  const t = useTranslations()

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <TimeWiseIcon className="h-6 w-6 text-primary" />
        <h1 className="font-headline text-xl font-bold tracking-tight">
          {t('common.appName')}
        </h1>
      </div>
      <div
        className="ml-auto flex items-center gap-2"
        role="navigation"
        aria-label="Top navigation"
      >
        <Button asChild variant="outline" className="hidden md:flex">
          <Link href="/export">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {t('tracker.headerExportLink')}
          </Link>
        </Button>
        <UserMenu />
      </div>
    </header>
  )
}

export default TimeTrackerHeader
