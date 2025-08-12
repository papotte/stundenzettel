# Optional Compensation Split Feature Demo

## Overview

The new optional compensation split feature allows teams to choose between:

1. **Split Compensation** (default): Different rates for driver and passenger time
2. **Unified Compensation**: Single rate for all time, regardless of driver/passenger status

## How It Works

### Team Administrator Configuration

1. Navigate to **Team Management** → **Settings** → **Team Settings** tab
2. In the **Compensation Defaults** section, you'll see a new checkbox:
   - ✅ **Enable Driver/Passenger Compensation Split**
   - When checked: Shows separate fields for driver and passenger compensation percentages
   - When unchecked: Uses a single compensation rate for all time

### For Companies That Don't Differentiate

Some companies treat all work time equally and don't need separate compensation for driver vs passenger time. With this feature:

- **Before**: Had to set driver and passenger rates even if they were the same
- **After**: Can disable the split entirely and use a unified approach

### Technical Implementation

- **UI**: Conditionally shows/hides compensation fields based on the setting
- **Backend**: When split is disabled, both driver and passenger compensation are set to the same value
- **Backward Compatibility**: Existing teams continue to work as before (split enabled by default)

## Benefits

1. **Simplified Setup**: Companies with uniform compensation can skip unnecessary configuration
2. **Cleaner UI**: Reduces cognitive load for teams that don't need the complexity
3. **Flexibility**: Teams can change this setting as their needs evolve
4. **Compliance**: Better matches various business models and compensation structures

## Example Use Cases

### Traditional Setup (Split Enabled)

- Driver time: 100% compensation
- Passenger time: 90% compensation
- Use case: Field service companies where drivers get full rate, passengers get reduced rate

### Simplified Setup (Split Disabled)

- All time: 100% compensation
- Use case: Consulting companies where all billable time is valued equally regardless of travel role

## Multi-Language Support

This feature is fully translated and available in:

- 🇺🇸 English
- 🇩🇪 German (Deutsch)
- 🇪🇸 Spanish (Español)
