'use client'

import React from 'react'

import { useTranslations } from 'next-intl'

import type { UserSettings } from '@/lib/types'

interface TimesheetHeaderProps {
  userSettings: UserSettings | null
}

const TimesheetHeader = ({ userSettings }: TimesheetHeaderProps) => {
  const t = useTranslations()

  const phoneNumbers = [
    userSettings?.companyPhone1,
    userSettings?.companyPhone2,
  ]
    .filter(Boolean)
    .join(' / ')

  const items = [
    { label: t('export.headerCompanyName'), value: userSettings?.companyName },
    {
      label: t('export.headerCompanyEmail'),
      value: userSettings?.companyEmail,
    },
    { label: t('export.headerCompanyPhone'), value: phoneNumbers },
    { label: t('export.headerCompanyFax'), value: userSettings?.companyFax },
  ].filter((item) => item.value)

  if (items.length === 0) {
    return null
  }

  return (
    <div
      className="mb-8 flex w-full flex-wrap justify-between gap-x-6 gap-y-1 text-sm print:mb-2 print:text-xs"
      data-testid="timesheet-header"
    >
      {items.map((item) => (
        <span key={item.label}>
          {item.label}: {item.value}
        </span>
      ))}
    </div>
  )
}

export default TimesheetHeader
