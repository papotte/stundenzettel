import { useTransition } from 'react'

import { useLocale } from 'next-intl'

import { Locale } from '@/i18n'
import { setUserLocale } from '@/services/locale'

import LanguageSelect from './language-select'

export default function LanguageSwitcher({
  className,
}: {
  className?: string
}) {
  const [_, startTransition] = useTransition()
  const locale = useLocale()

  function onChange(value: string) {
    const locale = value as Locale
    startTransition(() => {
      setUserLocale(locale)
    })
  }

  return (
    <LanguageSelect
      value={locale}
      onChange={onChange}
      className={className}
      data-testid="language-switcher"
    />
  )
}
