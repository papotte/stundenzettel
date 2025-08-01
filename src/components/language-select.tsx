import { useTranslations } from 'next-intl'

import { locales } from '@/i18n'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

export default function LanguageSelect({
  value,
  onChange,
  className,
  id,
  ...props
}: {
  value: string
  onChange: (lang: string) => void
  className?: string
  id?: string
}) {
  const t = useTranslations()
  return (
    <Select value={value} onValueChange={onChange} {...props}>
      <SelectTrigger className={className || 'w-24'} id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((lang) => (
          <SelectItem key={lang} value={lang}>
            {t(
              `settings.language${lang.charAt(0).toUpperCase() + lang.slice(1)}`,
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
