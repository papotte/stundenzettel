# Team-wide Settings Implementation

This implementation adds comprehensive team-wide settings functionality to the TimeWise Tracker application.

## Features Implemented

### 1. Team Settings Data Model

- **TeamSettings interface** with configuration options for:
  - Export format and field preferences
  - Default compensation percentages for team members
  - Override permissions for individual user settings
  - Team company details

### 2. Service Layer

- **team-settings-service.ts** - Firestore-backed service implementation
- Follows the existing pattern used by other services in the application

### 3. Enhanced UI Components

#### Team Settings Dialog

Enhanced the existing `TeamSettingsDialog` component with:

- **Tabbed interface** for better organization
- **Export Configuration** tab with format and field selection
- **Compensation Defaults** for setting team-wide compensation rates
- **Override Permissions** to control what members can modify
- **Team Company Details** for shared company information

#### User Settings Integration

Modified the company/compensation settings page to:

- Check for team membership and apply team settings
- Disable fields when override permissions are restricted
- Show visual indicators when settings are inherited from team
- Display helpful messages about team-controlled settings

### 4. Internationalization

Added comprehensive translations in both English and German for:

- All new team settings options
- Override permission messages
- Help text and descriptions

## How It Works

### For Team Administrators

1. Navigate to Team Management → Settings
2. Use the new tabbed interface to configure:
   - Default export formats and fields
   - Compensation percentages for all team members
   - Which settings members can override
   - Company details used in exports

### For Team Members

1. Individual settings pages now respect team configurations
2. Fields controlled by team settings are disabled with explanatory messages
3. Settings inherit team defaults but can be overridden if permitted
4. Visual indicators show when settings come from team configuration

### Service Integration

The `getEffectiveUserSettings` function:

- Combines individual user settings with team defaults
- Respects override permissions
- Returns both effective settings and permission status
- Maintains backward compatibility for users without teams

## Technical Details

### Data Flow

1. Team admin configures settings via enhanced dialog
2. Settings stored in team document's `settings` field
3. When users load their settings, system checks for team membership
4. Team settings are merged with user settings based on override permissions
5. UI reflects effective settings and permission status

### Override Logic

- If user has no team: Full control over all settings
- If team setting exists and override not allowed: Team setting takes precedence
- If team setting exists and override allowed: User can customize
- Company details from team always take precedence when set

### Storage

- Team settings stored as part of team document in Firestore
- No changes required to user settings storage
- Backward compatible with existing data

## Testing

Created comprehensive tests for:

- Setting and retrieving team settings
- Handling non-existent teams
- Partial updates to team settings
- Override permission logic

## Future Enhancements

This foundation enables future features like:

- Team-wide time tracking policies
- Standardized project/location lists
- Automated reporting configurations
- Advanced permission management

The implementation follows the established patterns in the codebase and maintains full backward compatibility while adding powerful new functionality for team collaboration.
