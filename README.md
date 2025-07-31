# TimeWise Tracker

## Table of Contents

- [Features](#features)
- [Subscription-Guarded Pages & Buttons](#subscription-guarded-pages--buttons)
- [Tech Stack](#tech-stack)
- **Getting Started**
  - [Getting Started](#getting-started)
  - [Data Model Migration](#data-model-migration)
- **Development**
  - [Code Quality (Linting & Formatting)](#code-quality--linting--formatting-)
  - [End-to-End Testing (Playwright)](#end-to-end-testing--playwright-)
- **Deployment**
  - [Deploying to Production (Firebase)](#deploying-to-production--firebase-)
  - [CI/CD with GitHub Actions](#cicd-with-github-actions)
- **Other**
  - [Internationalization (i18n)](#internationalization--i18n-)
  - [Troubleshooting](#troubleshooting)

A Next.js application for effortless time tracking, designed for Firebase Studio.

## Features

- Live time tracking with location input.
- Manual time entry and editing.
- Special entry types for Sick Leave, PTO, and Bank Holidays.
- Daily, weekly, and monthly time summaries.
- Export timesheets to professionally formatted Excel and PDF files.
- English and German language support.
- Test mode for local development without Firebase.

---

## Subscription-Guarded Pages & Buttons

Some features are only available to users with an active (or trialing) subscription. The project provides two main tools for this:

### 1. Guarding Entire Pages or Sections

Use the `SubscriptionGuard` component to wrap any page or section that should only be accessible to subscribed users. If the user is not subscribed, they will see a prompt to subscribe or log in.

**Example:**

```tsx
import SubscriptionGuard from '@/components/subscription-guard'

export default function ProPage() {
  return <SubscriptionGuard>{/* Pro-only content here */}</SubscriptionGuard>
}
```

You can also provide a custom fallback UI using the `fallback` prop.

### 2. Guarding Individual Buttons (or Actions)

Use the `SubscriptionGuardButton` component anywhere you want a button to be enabled only for subscribed users. If the user is not subscribed, the button will be disabled and a "Pro" badge will appear inside the button.

**Example:**

```tsx
import { SubscriptionGuardButton } from '@/components/ui/button'

;<SubscriptionGuardButton onClick={handleExport}>
  <DownloadIcon /> Export
</SubscriptionGuardButton>
```

This is ideal for export, download, or other premium actions.

---

## Tech Stack

- [Next.js](https://nextjs.org/) (with App Router)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [ShadCN UI](https://ui.shadcn.com/)
- [Firebase](https://firebase.google.com/) (Authentication & Firestore)
- [ExcelJS](https://github.com/exceljs/exceljs) for Excel exports
- [next-intl](https://next-intl-docs.vercel.app/) for internationalization

---

## Getting Started

Follow these instructions to set up and run the project in your local development environment.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- [Firebase CLI](https://firebase.google.com/docs/cli) (for deploying rules)

### 1. Installation

Clone the repository and install the project dependencies.

```bash
npm install
```

### 2. Environment Configuration

The application can run in two modes: **Local Mode** (using mock data) or **Firebase Mode** (connecting to your Firebase project). You switch between them using an environment variable in a `.env.local` file.

#### Local Mode (for Test & Development)

For local development and testing, you can use mock data without connecting to any external services. This is the recommended mode for UI development.

Create a `.env.local` file in the root of your project and set the environment to `test` or `development`:

```env
# For local testing and development with mock data
NEXT_PUBLIC_ENVIRONMENT=development
```

or

```env
NEXT_PUBLIC_ENVIRONMENT=test
```

This will automatically load pre-populated sample data and let you select a mock user on the login screen, bypassing the Firebase authentication.

#### Firebase Mode (for Production)

To connect to a live Firebase backend, you'll need your project credentials.

1.  **Create a `.env.local` file** in the root of your project.
2.  **Set the environment** to `production` (or any value other than `test` or `development`).
    ```env
    # For a production environment connecting to Firebase
    NEXT_PUBLIC_ENVIRONMENT=production
    ```
3.  **Add Firebase Credentials:**
    - Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
    - In your project, go to Project Settings and add a new Web App.
    - Copy the Firebase configuration credentials into your `.env.local` file.
4.  **Add Google Maps API Key:**
    - Go to the [Google Cloud Console](https://console.cloud.google.com/).
    - In the same project used for Firebase, navigate to "APIs & Services" > "Library" and enable the **Geocoding API**.
    - Navigate to "APIs & Services" > "Credentials" and create a new API Key.
    - Add this API key to your `.env.local` file.

Your final `.env.local` file for Firebase Mode should look like this:

```env
# Set to 'production' to use Firebase
NEXT_PUBLIC_ENVIRONMENT=production

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# (Optional) Firestore Database ID
# Only needed if you are NOT using the "(default)" database in Firestore.
# Most projects can leave this line out.
NEXT_PUBLIC_FIREBASE_DATABASE_ID=your_custom_database_id

# Google Maps Geocoding API Key
# Used for the "Get current location" feature
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002).

---

## Data Model Migration

For information about data model migrations and how to run them, see [MIGRATIONS.md](./MIGRATIONS.md).

---

## Code Quality (Linting & Formatting)

This project uses [ESLint](https://eslint.org/) for linting and [Prettier](https://prettier.io/) for code formatting to ensure code quality and consistency.

- **ESLint**: Catches common errors and enforces best practices. Configuration is in `.eslintrc.json`.
- **Prettier**: Automatically formats code to a consistent style. Configuration is in `.prettierrc`.
- **Tailwind CSS Plugin**: The Prettier setup includes a plugin that automatically sorts Tailwind CSS classes, keeping them organized and readable.

### Available Scripts

You can run the linter and formatter using the following npm scripts:

- **Check for linting errors:**
  ```bash
  npm run lint
  ```
- **Check for formatting errors without changing files:**
  ```bash
  npm run format:check
  ```
- **Automatically format all files:**
  ```bash
  npm run format
  ```

It's recommended to run `npm run format` before committing your changes. The CI pipeline will use `npm run format:check` to verify that all code is correctly formatted.

---

## End-to-End Testing (Playwright)

This project uses [Playwright](https://playwright.dev/) for end-to-end (E2E) testing. These tests launch a real browser and interact with the application just like a user would.

### Running E2E Tests

To run the E2E test suite, use the following command:

```bash
npm run test:e2e
```

This will automatically:

1.  Start the development server.
2.  Run all tests located in the `e2e/` directory.
3.  Shut down the server once the tests are complete.

The test report will be available in the `playwright-report` directory.

### First-Time Setup & Dependencies

When you run `npm install`, the necessary Playwright **browser binaries** are downloaded automatically.

However, Playwright also requires certain **system-level dependencies** to run those browsers. In some environments (like a fresh Linux install or a container), you may need to install these manually. If your tests fail to launch a browser, run the following command from an interactive terminal to have Playwright attempt to install them for you:

```bash
npx playwright install --with-deps
```

This command may ask for administrative privileges (`sudo`) to install packages.

---

## Deploying to Production (Firebase)

Deploying your application involves two main steps: deploying the app itself with **App Hosting**, and deploying the **Firestore Security Rules**.

### 1. Set Your Secrets for App Hosting

When you deploy your application to Firebase App Hosting, the variables in your local `.env.local` file are **not** automatically used. For security, you must set these values as secrets in your Firebase project.

You can do this using the Firebase CLI in your terminal. For each variable in your `.env.local` file, run the following command, replacing `SECRET_NAME` and `your_value_here` accordingly.

```bash
firebase apphosting:secrets:set SECRET_NAME
```

When prompted, enter the secret value (`your_value_here`). You will need to set the following secrets:

- `NEXT_PUBLIC_ENVIRONMENT` (set this to `production`)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_FIREBASE_DATABASE_ID` (Optional: Only if you use a non-default database)

**Example:**

```bash
# This command will prompt you to enter the value for your API key
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_API_KEY
```

### 2. Deploy Your Application Manually

After setting all your secrets, you can deploy your application to Firebase App Hosting from your local machine:

```bash
firebase deploy --only apphosting
```

See the **CI/CD with GitHub Actions** section for details on automated deployments.

### 3. Deploy Firestore Security Rules

Your database is protected by security rules defined in the `firestore.rules` file. These rules are **deployed automatically** by the CI/CD pipeline whenever a new release is created.

If you need to deploy them manually, you can run the following command from your project's root directory:

```bash
firebase deploy --only firestore:rules
```

---

## CI/CD with GitHub Actions

This project includes a complete CI/CD pipeline configured with GitHub Actions. The workflows are defined in the `.github/workflows` directory.

### Workflows Overview

- **`ci.yml` (Continuous Integration)**:
  - **Trigger**: Runs on every push to a pull request.
  - **Jobs**:
    - `lint-and-format`: Checks for linting and formatting errors.
    - `tests`: Runs unit and end-to-end tests in parallel.
    - `build`: Builds the Next.js application.
  - **Purpose**: Ensures that all new code meets quality standards and doesn't break existing functionality before it gets merged.

- **`main.yml` (Continuous Release)**:
  - **Trigger**: Runs on every push to the `main` branch.
  - **Jobs**:
    - Runs all the same checks as the `ci.yml` workflow.
    - If all checks pass, it uses `semantic-release` to automatically:
      1.  Analyze commit messages to determine the next version number (patch, minor, or major).
      2.  Generate release notes from the commit history.
      3.  Create a new Git tag and a GitHub Release.
      4.  Push the version bump to `package.json`.
  - **Conventional Commits**: This workflow relies on commit messages following the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification (e.g., `feat: ...`, `fix: ...`).

- **`version-bump.yml` (Automatic Version Bumping)**:
  - **Trigger**: Runs when a pull request is merged into the `main` branch.
  - **Jobs**:
    - Bumps the project version and creates a new tag based on PR title keywords (`#major`, `#minor`, `#patch`).
    - Uses [`phips28/gh-action-bump-version`](https://github.com/marketplace/actions/github-tag-bump) to determine the version bump type.
  - **Purpose**: Ensures that every merge to `main` results in a version bump and tag, following the PR's intent.

- **`deploy.yml` (Continuous Deployment)**:
  - **Trigger**: Runs automatically whenever a new GitHub Release is `published`.
  - **Jobs**:
    - Runs E2E tests as a final gate before deployment.
    - Deploys the application to **Firebase App Hosting**.
  - **Setup**: For this workflow to succeed, you must create a `FIREBASE_SERVICE_ACCOUNT_JSON` secret in your GitHub repository's settings. See below for instructions.

- **`nightly.yml` (Nightly Tests)**:
  - **Trigger**: Runs on a schedule (daily at 5 AM UTC).
  - **Jobs**: Runs the full E2E test suite against the `main` branch to catch any regressions that might have been missed.

### Required GitHub Secret for Deployment

To allow GitHub Actions to deploy your application to Firebase, you must create a service account and add its key as a secret to your repository.

1.  **Create a Service Account**:
    - Go to the [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts) for your project.
    - Click **+ CREATE SERVICE ACCOUNT**.
    - Give it a name (e.g., `github-actions-deploy`) and click **CREATE AND CONTINUE**.
    - Grant it the following two roles:
      - **Firebase App Hosting Admin** (to deploy the app)
      - **Firebase Admin** (can be narrowed, but this is simple for setup)
    - Click **CONTINUE**, then **DONE**.
2.  **Generate a JSON Key**:
    - Find the service account you just created in the list.
    - Click the three-dot menu on the right and select **Manage keys**.
    - Click **ADD KEY** > **Create new key**.
    - Select **JSON** and click **CREATE**. A JSON file will be downloaded to your computer.
3.  **Create the GitHub Secret**:
    - In your GitHub repository, go to **Settings > Secrets and variables > Actions**.
    - Click **New repository secret**.
    - Name the secret `FIREBASE_SERVICE_ACCOUNT_JSON`.
    - Open the downloaded JSON file, copy its entire contents, and paste it into the **Value** field in GitHub.
    - Click **Add secret**.

The `deploy.yml` workflow is now configured to use this secret to authenticate with Firebase and deploy your application.

---

## Internationalization (i18n)

This project supports **English** and **German** languages using [next-intl](https://next-intl-docs.vercel.app/).

**Quick start:**

```tsx
import { useTranslations } from 'next-intl'
const t = useTranslations()
return <h1>{t('common.appName')}</h1>
```

**For complete documentation:** See [docs/i18n-setup.md](./docs/i18n-setup.md)

---

## Troubleshooting

### Error: `Firestore... 400 (Bad Request)` or Permission Errors

This error usually means that either the necessary Google Cloud APIs are not enabled, or your Firestore security rules are blocking access.

**Solution:**

1.  **Enable Cloud APIs:**
    - Make sure you are logged into the Google account associated with your Firebase project.
    - Go to the [Google Cloud Console](https://console.cloud.google.com/) for your project.
    - Navigate to **APIs & Services > Library**.
    - Search for and enable the following two APIs if they are not already active:
    - **Cloud Firestore API**
    - **Identity Toolkit API** (required for Firebase Authentication)
    - **Important:** Many Google Cloud services, even those with a generous free tier, require a billing account to be linked to the project to function. Navigate to the **Billing** section in the Google Cloud Console and ensure your project is linked to a billing account.

2.  **Deploy Security Rules:**
    - If you've just created your project, its database is locked down by default. You need to deploy the security rules included in this project.
    - Run the following command from your project directory:
    ```bash
    firebase deploy --only firestore:rules
    ```
