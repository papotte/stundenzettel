import { useTranslation } from '@/context/i18n-context'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

export default function LanguageSwitcher({
  className,
}: {
  className?: string
}) {
  const { language, setLanguageState } = useTranslation()
  return (
    <div data-testid="language-switcher">
      <Select value={language} onValueChange={setLanguageState}>
        <SelectTrigger className={className || 'w-24'}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="de">Deutsch</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
