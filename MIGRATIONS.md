# Data Model Migrations

This document tracks all data model migrations for the project. Each migration entry includes a timestamp, a summary of what changed, and instructions for running the migration.

---

## Migration: 2024-07-01 — Time Entry Model Refactor

**Timestamp:** 2024-07-01

### What Changed

- Replaced `travelTime` and `isDriver` fields with `driverTimeHours` and `passengerTimeHours` in time entries.
- Compensation logic now uses `driverTimeHours` and `passengerTimeHours` with user-configurable compensation percentages.

### What the Migration Does

- For each time entry:
  - If `isDriver` was `true`, sets `driverTimeHours = travelTime` and `passengerTimeHours = 0`.
  - If `isDriver` was `false`, sets `driverTimeHours = 0` and `passengerTimeHours = travelTime`.
  - Removes the old `isDriver`, and `drivingTime` fields if present.

### How to Run the Migration

Run the migration script from the project root:

```bash
node scripts/migrate-travelTime-to-driverTimeHours.js
```

- This script will update all time entries to use the new fields and remove obsolete fields.
- Make sure you have access to your Firestore database or local data as needed.

If you do not have a script, you can manually update your data as described above.

---

_Add new migrations below with a timestamp, summary, and instructions._
