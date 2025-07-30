# Internationalization (i18n) Setup

This project uses [next-intl](https://next-intl-docs.vercel.app/) for internationalization support.

## Project Structure

```
src/
  messages/           # Translation files
    en/              # English translations
      common.json    # App name, basic actions (7 keys)
      login.json     # Authentication UI (16 keys)
      tracker.json   # Time tracking interface (27 keys)
      settings.json  # Settings pages (22 keys)
      special-locations.json  # Special work location types (4 keys)
      time-entry-card.json   # Time entry display/actions (8 keys)
      toasts.json    # Notification messages (21 keys)
    de/              # German translations (same structure)
  i18n.ts            # next-intl configuration
  hooks/
    use-translation-compat.ts  # Compatibility hook
    use-language-manager.ts    # Language switching
  context/
    next-intl-provider.tsx     # Provider with user preferences
```

## Configuration Files

- **`middleware.ts`** - Handles locale detection
- **`next.config.ts`** - Includes next-intl plugin
- **`src/i18n.ts`** - Configures message loading

## Usage

### Using Translations in Components

```tsx
import { useTranslations } from 'next-intl'

function MyComponent() {
  const t = useTranslations()

  return (
    <div>
      <h1>{t('common.appName')}</h1>
      <p>{t('tracker.liveTrackingDescription')}</p>
      <p>{t('toasts.entryAddedDescription', { location: 'Office' })}</p>
    </div>
  )
}
```

### Language Switching

```tsx
import { useLanguageManager } from '@/hooks/use-language-manager'

function LanguageSwitcher() {
  const { currentLanguage, changeLanguage } = useLanguageManager()

  return (
    <select
      value={currentLanguage}
      onChange={(e) => changeLanguage(e.target.value as 'en' | 'de')}
    >
      <option value="en">English</option>
      <option value="de">Deutsch</option>
    </select>
  )
}
```

## Supported Languages

- **English (en)** - Default language
- **German (de)** - Secondary language

## Translation Key Format

Translation keys use dot notation to organize by namespace:

- `common.*` - Basic app-wide translations
- `login.*` - Authentication related
- `tracker.*` - Time tracking features
- `settings.*` - Settings and preferences
- `special_locations.*` - Special work location types
- `time_entry_card.*` - Time entry display
- `toasts.*` - Notification messages

## Features

- ✅ **Namespace organization** - Translations split by feature area
- ✅ **User preferences** - Language choice persisted to user settings
- ✅ **Interpolation** - Support for dynamic values in translations
- ✅ **TypeScript support** - Type-safe translation keys
- ✅ **Performance** - Tree shaking of unused translations
- ✅ **SSR compatible** - Works with Next.js server-side rendering

## Adding New Translations

1. Add the key to the appropriate namespace file in both `en/` and `de/` folders
2. Update the `src/i18n.ts` file if adding a new namespace
3. Update the compatibility hook if adding a new namespace
4. Use the new translation key in your component: `t('namespace.key')`

## Language Persistence

Language preferences are automatically:

- Loaded from user settings on login
- Saved to user settings when changed
- Applied on page reload for consistency
- Fall back to browser language for non-authenticated users

## Migration Notes

This setup replaces the previous custom i18n implementation while maintaining backward compatibility for existing translation keys.
