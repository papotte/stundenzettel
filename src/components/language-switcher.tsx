import { useTranslation } from '@/context/i18n-context'

import LanguageSelect from './language-select'

export default function LanguageSwitcher({
  className,
}: {
  className?: string
}) {
  const { language, setLanguageState } = useTranslation()
  return (
    <LanguageSelect
      value={language}
      onChange={(lang) => setLanguageState(lang as 'en' | 'de')}
      className={className}
      data-testid="language-switcher"
    />
  )
}
