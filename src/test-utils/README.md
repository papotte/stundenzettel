# Test Utilities

This directory contains utilities to help with testing components in the application.

## Internationalization (i18n) Testing

Internationalization is handled globally through Jest configuration. The `jest.config.ts` file mocks `next-intl` to use `src/test-utils/next-intl-mock.ts`, which provides all necessary i18n functions globally for tests.

### How it works

The global mock provides:

- `useTranslations` - Returns translation keys (e.g., `'common.button.save'`)
- `useFormatter` - Provides date, number, and relative time formatting
- `useLocale` - Returns the current locale
- `useMessages` - Returns mock message objects

This approach allows you to:

1. Test that the correct translation keys are being used
2. Avoid loading actual translation files in tests
3. Make tests more predictable and faster
4. Focus on testing component logic rather than translation content

### Usage

Since i18n is handled globally, you can test components normally without any special wrappers:

```tsx
import { render, screen } from '@testing-library/react'

import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('should render translated content', () => {
    render(<MyComponent />)

    // The component will display translation keys instead of actual messages
    expect(screen.getByText('common.button.save')).toBeInTheDocument()
    expect(screen.getByText('landing.features.title')).toBeInTheDocument()
  })
})
```

### Migration from existing tests

If you have existing tests that expect actual translated text, you can update them to expect the translation keys instead:

```tsx
// Before
expect(screen.getByText('Save')).toBeInTheDocument()

// After
expect(screen.getByText('common.button.save')).toBeInTheDocument()
```

This makes tests more maintainable and less dependent on specific translation content.

## Available Utilities

### Auth Mocks

The `auth-mocks.ts` file provides utilities for mocking authentication in tests:

- `createMockAuthContext` - Creates a mock auth context
- `createMockUser` - Creates a mock user object
- `authScenarios` - Predefined auth scenarios for testing
- `setupAuthMock` - Sets up auth mocks for specific test scenarios

### Stripe Mocks

The `stripe-mocks.ts` file provides utilities for mocking Stripe functionality in tests.

### Common Testing Utilities

The `index.ts` file re-exports common testing utilities from `@testing-library/react` and `@testing-library/user-event` for convenience.
