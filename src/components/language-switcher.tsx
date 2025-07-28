import { useLanguageManager } from '@/hooks/use-language-manager'

import LanguageSelect from './language-select'

export default function LanguageSwitcher({
  className,
}: {
  className?: string
}) {
  const { currentLanguage, changeLanguage } = useLanguageManager()
  return (
    <LanguageSelect
      value={currentLanguage}
      onChange={(lang) => changeLanguage(lang as 'en' | 'de')}
      className={className}
      data-testid="language-switcher"
    />
  )
}
