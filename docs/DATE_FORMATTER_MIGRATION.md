# Date Formatter Migration Guide

This guide helps you migrate from next-intl's date formatting to our new timezone-safe date formatter that uses date-fns under the hood.

## Why Migrate?

The new date formatter provides better timezone control and consistency, addressing the timezone issues you've been experiencing with next-intl's date formatting.

## What's Changed

### Before (next-intl)

```tsx
import { useFormatter } from 'next-intl'

function MyComponent() {
  const format = useFormatter()

  return (
    <div>
      <p>Time: {format.dateTime(date, 'shortTime')}</p>
      <p>Date: {format.dateTime(date, 'long')}</p>
    </div>
  )
}
```

### After (new date formatter)

```tsx
import { useFormatter } from '@/lib/date-formatter'

function MyComponent() {
  const format = useFormatter()

  return (
    <div>
      <p>Time: {format.dateTime(date, 'shortTime')}</p>
      <p>Date: {format.dateTime(date, 'long')}</p>
    </div>
  )
}
```

## Migration Steps

### 1. Update Import Statements

Replace all imports of `useFormatter` from next-intl with our custom version:

```tsx
// Before
import { useFormatter, useTranslations } from 'next-intl'

// After
import { useTranslations } from 'next-intl'
import { useFormatter } from '@/lib/date-formatter'
```

### 2. Files to Update

The following files need to be updated:

- `src/components/time-entry-form.tsx` ✅ (already updated)
- `src/hooks/use-time-tracker.ts` ✅ (already updated)
- `src/components/timesheet-preview.tsx`
- `src/components/export-preview.tsx`
- `src/components/team/user-invitations-list.tsx`
- `src/app/(app)/subscription/page.tsx`
- `src/lib/excel-export.ts`

### 3. API Compatibility

The new formatter maintains the same API as next-intl's formatter:

```tsx
const format = useFormatter()

// All these work the same way:
format.dateTime(date, 'long') // Monday, January 15, 2024
format.dateTime(date, 'short') // 1/15/2024
format.dateTime(date, 'shortTime') // 14:30
format.dateTime(date, 'month') // January
format.dateTime(date, 'monthYear') // January 2024
format.dateTime(date, 'yearMonth') // 2024/1
format.dateTime(date, 'weekday') // Mon
```

### 4. Direct Function Usage

For use outside of React components, you can use the direct function:

```tsx
import { formatDateTime } from '@/lib/date-formatter'

// Format a date directly
const formattedDate = formatDateTime(date, 'long', 'en')
```

## Benefits

1. **Timezone Safety**: The new formatter handles timezone conversion more predictably
2. **Consistency**: Uses date-fns throughout, maintaining consistency with your existing time utilities
3. **Better Control**: More predictable behavior across different environments
4. **Same API**: Drop-in replacement - no need to change existing code logic

## Testing

The new date formatter includes comprehensive tests in `src/lib/__tests__/date-formatter.test.ts` that verify:

- Correct formatting in English and German
- Timezone independence
- Consistent time formatting
- Proper locale handling

## Rollback Plan

If you need to rollback, simply revert the import statements back to:

```tsx
import { useFormatter, useTranslations } from 'next-intl'
```

The API is identical, so no other code changes would be needed.

## Next Steps

1. Update the remaining files listed in step 2
2. Test the application thoroughly, especially time-related features
3. Monitor for any timezone-related issues
4. Remove the old next-intl date formatting configuration if no longer needed

## Support

If you encounter any issues during migration, check:

1. The test file for expected behavior
2. The date formatter implementation in `src/lib/date-formatter.ts`
3. Your existing time utilities in `src/lib/time-utils.ts` for consistency
