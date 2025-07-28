# Session Storage for Local Services

This document explains how session storage is used in the local services for testing and development purposes.

## Overview

The local services (team, time entries, user settings) now persist data in the browser's session storage. This means that:

- Data created during a session will persist across page reloads
- Data is cleared when the browser tab is closed
- This makes testing more realistic and allows for better development workflows

## How It Works

### Storage Keys

The following session storage keys are used:

- `timewise_local_teams` - Team data
- `timewise_local_members` - Team member data
- `timewise_local_invitations` - Team invitation data
- `timewise_local_subscriptions` - Subscription data
- `timewise_local_counters` - ID counters for generating unique IDs
- `timewise_local_time_entries` - Time entry data
- `timewise_local_user_settings` - User settings data

### Data Persistence

All local services automatically:

1. Load data from session storage on initialization
2. Save data to session storage whenever it changes
3. Handle date conversion (JSON doesn't preserve Date objects)
4. Provide fallback to default data if storage is empty

## Development Utilities

In development mode, you can access utilities through the browser console:

### Available Commands

```javascript
// Clear all session storage data
TimeWiseDev.clearStorage()

// View all session storage data
TimeWiseDev.viewStorage()

// Export session storage data as JSON
TimeWiseDev.exportStorage()

// Import session storage data from JSON
TimeWiseDev.importStorage(jsonString)

// Reset the application to initial state
TimeWiseDev.resetApp()

// Show help for all available commands
TimeWiseDev.help()
```

### Example Usage

1. **Clear data and start fresh:**

   ```javascript
   TimeWiseDev.clearStorage()
   // Then refresh the page
   ```

2. **View what data is stored:**

   ```javascript
   TimeWiseDev.viewStorage()
   ```

3. **Backup your current data:**

   ```javascript
   const backup = TimeWiseDev.exportStorage()
   console.log(backup) // Copy this JSON
   ```

4. **Restore data from backup:**
   ```javascript
   TimeWiseDev.importStorage(backupJsonString)
   // Then refresh the page
   ```

## Testing Benefits

### For E2E Tests

- Tests can now create realistic data that persists across test steps
- You can test complete user workflows without losing data
- Tests can verify that data is properly saved and loaded

### For Development

- You can create test data and have it persist while you work
- You can test the complete team creation flow without losing data on page reload
- You can simulate real user scenarios more easily

## Implementation Details

### Date Handling

Since JSON doesn't preserve Date objects, the storage utilities automatically:

- Convert Date objects to strings when saving
- Convert strings back to Date objects when loading

### Error Handling

The storage utilities include error handling for:

- Invalid JSON data
- Missing storage keys
- Storage quota exceeded
- Server-side rendering (SSR) environments

### Performance

- Data is only saved when it actually changes
- Storage operations are wrapped in try-catch blocks
- Console warnings are shown for storage errors

## Troubleshooting

### Data Not Persisting

1. Check if you're in development mode
2. Open browser console and run `TimeWiseDev.viewStorage()`
3. Check for any console errors related to storage

### Storage Quota Exceeded

If you see storage quota errors:

1. Clear some data: `TimeWiseDev.clearStorage()`
2. Or export and clear: `TimeWiseDev.exportStorage()` then `TimeWiseDev.clearStorage()`

### Data Corruption

If data appears corrupted:

1. Export current data: `TimeWiseDev.exportStorage()`
2. Clear storage: `TimeWiseDev.clearStorage()`
3. Refresh page to start fresh

## API Reference

### Session Storage Utils

```typescript
// Clear all session storage data
clearAllSessionStorage(): void

// Get all session storage data
getSessionStorageData(): Record<string, unknown>

// Export data as JSON string
exportSessionStorageData(): string

// Import data from JSON string
importSessionStorageData(jsonData: string): void
```

### Service-Specific Functions

```typescript
// Team service
clearSessionStorage(): void

// Time entry service
clearTimeEntriesStorage(): void

// User settings service
clearUserSettingsStorage(): void
```

## Best Practices

1. **For Testing:** Use `TimeWiseDev.clearStorage()` before running tests to ensure a clean state
2. **For Development:** Use `TimeWiseDev.exportStorage()` to backup interesting test scenarios
3. **For Debugging:** Use `TimeWiseDev.viewStorage()` to inspect the current state
4. **For Collaboration:** Share exported JSON data with team members to reproduce issues
