# Internationalization (i18n) Setup

This project uses [next-intl](https://next-intl-docs.vercel.app/) for comprehensive internationalization support, providing a seamless multilingual experience for users.

## Supported Languages

- **English (en)** - Default language
- **German (de)** - Secondary language
- **Spanish (es)** - Third language

## Project Structure

```
src/
  messages/           # Translation files
    en/              # English translations
      common.json    # App name, basic actions (15 keys)
      login.json     # Authentication UI (19 keys)
      tracker.json   # Time tracking interface (30 keys)
      settings.json  # Settings pages (95 keys)
      nav.json       # Navigation elements (12 keys)
      landing.json   # Landing page content (102 keys)
      export.json    # Export functionality (23 keys)
      teams.json     # Team management (148 keys)
      subscription.json # Subscription features (38 keys)
      special-locations.json  # Special work location types (7 keys)
      time-entry-card.json   # Time entry display/actions (11 keys)
      time-entry-form.json   # Time entry form (48 keys)
      toasts.json    # Notification messages (24 keys)
    de/              # German translations (same structure)
    es/              # Spanish translations (same structure)
  i18n.ts            # next-intl configuration
  components/
    language-switcher.tsx    # Language switching component
    language-select.tsx      # Language selection dropdown
  services/
    locale.ts               # Locale persistence service
```

## Configuration Files

- **`middleware.ts`** - Handles locale detection and routing
- **`next.config.ts`** - Includes next-intl plugin configuration
- **`src/i18n.ts`** - Configures message loading and locale settings
- **`src/lib/i18n/formats.ts`** - Defines date/time formatting options

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

The project includes a `LanguageSwitcher` component that can be used anywhere in the application:

```tsx
import LanguageSwitcher from '@/components/language-switcher'

function Header() {
  return (
    <header>
      <LanguageSwitcher className="ml-auto" />
    </header>
  )
}
```

### Language Switching (Alternative Implementation)

```tsx
import { useLanguageManager } from '@/hooks/use-language-manager'

function LanguageSwitcher() {
  const { currentLanguage, changeLanguage } = useLanguageManager()

  return (
    <select
      value={currentLanguage}
      onChange={(e) => changeLanguage(e.target.value as 'en' | 'de' | 'es')}
    >
      <option value="en">English</option>
      <option value="de">Deutsch</option>
      <option value="es">Español</option>
    </select>
  )
}
```

### Date and Time Formatting

The project includes predefined date and time formatting options in `src/lib/i18n/formats.ts`. These formats are automatically applied when using date/time formatting functions.

**Available formats:**

- `long` - Full date with weekday (e.g., "Monday, January 1, 2024")
- `short` - Numeric date (e.g., "1/1/2024")
- `shortTime` - 24-hour time (e.g., "14:30")
- `month` - Month name only (e.g., "January")
- `monthYear` - Month and year (e.g., "January 2024")
- `yearMonth` - Year and month (e.g., "2024/01")
- `weekday` - Short weekday (e.g., "Mon")

**Usage example:**

```tsx
import { useFormatter } from 'next-intl'

function DateComponent() {
  const format = useFormatter()
  const date = new Date()

  return (
    <div>
      <p>Long format: {format.dateTime(date, 'long')}</p>
      <p>Short format: {format.dateTime(date, 'short')}</p>
      <p>Time only: {format.dateTime(date, 'shortTime')}</p>
    </div>
  )
}
```

## Translation Key Organization

Translation keys are organized by feature namespace using dot notation:

- `common.*` - Basic app-wide translations
- `login.*` - Authentication related
- `tracker.*` - Time tracking features
- `settings.*` - Settings and preferences
- `nav.*` - Navigation elements
- `landing.*` - Landing page content
- `export.*` - Export functionality
- `teams.*` - Team management
- `subscription.*` - Subscription features
- `special_locations.*` - Special work location types
- `time_entry_card.*` - Time entry display
- `time_entry_form.*` - Time entry form
- `toasts.*` - Notification messages

## Features

- ✅ **Namespace organization** - Translations split by feature area
- ✅ **User preferences** - Language choice persisted via cookies and to user settings
- ✅ **Interpolation** - Support for dynamic values in translations
- ✅ **TypeScript support** - Type-safe translation keys
- ✅ **Performance** - Tree shaking of unused translations
- ✅ **SSR compatible** - Works with Next.js server-side rendering
- ✅ **Automatic locale detection** - Falls back to browser language for non-authenticated users

## Adding New Translations

1. **Add the translation key** to the appropriate namespace file in both `en/`, `de/`, and `es/` folders
2. **Update the configuration** in `src/i18n.ts` if adding a new namespace
3. **Use the new translation key** in your component: `t('namespace.key')`

### Adding a New Language

To add support for a new language (e.g., French - 'fr'):

1. **Update the locales array** in `src/i18n.ts`:
   ```typescript
   export const locales: [string, ...string[]] = ['en', 'de', 'es', 'fr']
   ```

2. **Create the language directory** and translation files:
   ```bash
   mkdir src/messages/fr
   # Copy and translate all 13 JSON files from src/messages/en/
   ```

3. **Add language option** to settings files:
   ```json
   // In src/messages/en/settings.json, de/settings.json, es/settings.json, fr/settings.json
   "languageFr": "French" // or "Français", "Französisch", "Francés"
   ```

4. **Test the implementation** to ensure all translations load correctly

### Example: Adding a New Translation

1. Add to `src/messages/en/common.json`:

```json
{
  "newFeature": "New Feature"
}
```

2. Add to `src/messages/de/common.json`:

```json
{
  "newFeature": "Neue Funktion"
}
```

3. Add to `src/messages/es/common.json`:

```json
{
  "newFeature": "Nueva Función"
}
```

4. Use in component:

```tsx
const t = useTranslations()
return <h2>{t('common.newFeature')}</h2>
```

## Language Persistence

Language preferences are automatically:

- Loaded from cookies on page load
- Saved to cookies when changed
- Applied consistently across page reloads
- Fall back to browser language for non-authenticated users

### Cookie Configuration

The locale service uses a cookie named `preferredLanguage` to persist user language preferences:

```typescript
// src/services/locale.ts
const COOKIE_NAME = 'preferredLanguage'

export async function getUserLocale() {
  return (await cookies()).get(COOKIE_NAME)?.value || defaultLocale
}

export async function setUserLocale(locale: Locale) {
  ;(await cookies()).set(COOKIE_NAME, locale)
}
```

## Testing with Translations

When writing tests, the translation context is already set up globally in `jest.setup.tsx`. You can reference translation keys directly in your tests without mocking the i18n context locally.

### Test Example

```tsx
import { render, screen } from '@testing-library/react'

import { useTranslations } from 'next-intl'

function TestComponent() {
  const t = useTranslations()
  return <h1>{t('common.appName')}</h1>
}

test('renders app name', () => {
  render(<TestComponent />)
  expect(screen.getByText('TimeWise Tracker')).toBeInTheDocument()
})
```

## Migration Notes

This setup replaces the previous custom i18n implementation while maintaining backward compatibility for existing translation keys.

### Key Differences from Previous Implementation

- Uses `next-intl` instead of custom i18n solution
- Cookie-based persistence instead of user settings
- Automatic locale detection via middleware
- Type-safe translation keys
- Better performance with tree shaking

## Troubleshooting

### Common Issues

1. **Translation not found**: Ensure the key exists in both `en/` and `de/` files
2. **Language not persisting**: Check that cookies are enabled and the locale service is working
3. **Build errors**: Verify all translation files are valid JSON
4. **TypeScript errors**: Make sure translation keys match the expected namespace structure

### Debugging

To debug translation issues:

1. Check the browser's developer tools for cookie values
2. Verify translation files are being loaded correctly
3. Use the `useTranslations` hook with proper namespace
4. Check middleware configuration for locale detection
