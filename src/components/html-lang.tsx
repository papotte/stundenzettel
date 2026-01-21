'use client'

import { useEffect } from 'react'

/** Sets document.documentElement.lang for a11y. Used when locale is resolved inside Suspense. */
export function HtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  return null
}
