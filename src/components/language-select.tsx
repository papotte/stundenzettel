import { useTranslation } from '@/context/i18n-context'

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
  ...props
}: {
  value: string
  onChange: (lang: string) => void
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <Select value={value} onValueChange={onChange} {...props}>
      <SelectTrigger className={className || 'w-24'}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">{t('settings.languageEnglish')}</SelectItem>
        <SelectItem value="de">{t('settings.languageGerman')}</SelectItem>
      </SelectContent>
    </Select>
  )
}
