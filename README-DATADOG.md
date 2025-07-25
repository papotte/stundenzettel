# Datadog RUM Setup for Stundenzettel

This document describes the Datadog Real User Monitoring (RUM) setup for the Stundenzettel time tracking application.

## Overview

On Firebase Hosting, only frontend monitoring via Datadog RUM is supported. Server-side metrics, traces, and custom DogStatsD metrics are **not** supported due to platform limitations.

## What You Get with RUM
- Frontend error tracking (uncaught exceptions, console errors)
- User session and performance monitoring
- Custom user actions (e.g., login/logout clicks)
- User journeys and page views

## Setup Instructions

### 1. Add RUM Script to Your App

The RUM script is already included in your `src/app/layout.tsx` and configured to use your Datadog credentials.

### 2. Configure Environment Variables

Add your Datadog RUM credentials to your environment:

```
NEXT_PUBLIC_DD_RUM_APPLICATION_ID=your_rum_application_id_here
NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN=your_rum_client_token_here
NEXT_PUBLIC_DD_SITE=datadoghq.com
NEXT_PUBLIC_DD_ENV=production
NEXT_PUBLIC_APP_VERSION=latest
```

### 3. Log Custom Actions and Errors

Use the `browserMetrics` helper from `src/lib/datadog-browser.ts` to log custom actions and errors:

```js
import { browserMetrics } from '@/lib/datadog-browser'

// Log a login click
browserMetrics.trackAction('login_click', { userId })

// Log a logout click
browserMetrics.trackAction('logout_click', { userId })

// Log a custom error
browserMetrics.trackError(new Error('Something went wrong'), { userId })
```

### 4. View Data in Datadog

- Go to **UX Monitoring → RUM Explorer** in Datadog.
- Filter by action name, error type, or user.
- Build dashboards or alerts based on these custom events.

## What is NOT Supported on Firebase Hosting
- Server-side metrics (DogStatsD, custom metrics)
- Traces and APM via dd-trace
- The Datadog Agent or hot-shots

## Advanced: Log Forwarding
If you want backend error visibility, set up [Google Cloud Logging → Datadog log forwarding](https://docs.datadoghq.com/integrations/google_cloud_platform/).

## Docs & Links
- [Datadog RUM Docs](https://docs.datadoghq.com/real_user_monitoring/)
- [RUM Explorer](https://docs.datadoghq.com/real_user_monitoring/explorer/)
- [RUM API Reference](https://docs.datadoghq.com/real_user_monitoring/browser/advanced_configuration/?tab=us#api)

---

**Summary:**
- RUM is fully supported and recommended for Firebase Hosting.
- Use `browserMetrics` to log custom actions and errors.
- View and analyze your frontend data in the Datadog RUM Explorer. 