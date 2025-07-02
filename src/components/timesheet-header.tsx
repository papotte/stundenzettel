'use client'

import React from 'react'

import type { UserSettings } from '@/lib/types'

interface TimesheetHeaderProps {
  userSettings: UserSettings | null
  t: (key: string, replacements?: Record<string, string | number>) => string
}

const TimesheetHeader = ({ userSettings, t }: TimesheetHeaderProps) => {
  const companyName = userSettings?.companyName || ''
  const email = userSettings?.companyEmail || ''
  const phone1 = userSettings?.companyPhone1 || ''
  const phone2 = userSettings?.companyPhone2 || ''
  const fax = userSettings?.companyFax || ''

  const phoneNumbers = [phone1, phone2].filter(Boolean).join(' / ')

  const contactParts = [
    companyName,
    email,
    phoneNumbers ? `Tel.: ${phoneNumbers}` : '',
    fax ? `FAX: ${fax}` : '',
  ].filter(Boolean)

  if (contactParts.length === 0) {
    return null
  }

  const detailsString = contactParts.join(' ')

  return (
    <div
      className="mb-8 flex w-full justify-between text-sm print:mb-2 print:text-xs"
      data-testid="timesheet-header"
    >
      <span>{t('export_preview.headerCompany')}</span>
      <span>{detailsString}</span>
    </div>
  )
}

export default TimesheetHeader
