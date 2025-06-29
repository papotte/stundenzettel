# TimeWise Tracker

A Next.js application for effortless time tracking, designed for Firebase Studio.

## Features

- Live time tracking with location input.
- Manual time entry and editing.
- Special entry types for Sick Leave, PTO, and Bank Holidays.
- Daily, weekly, and monthly time summaries.
- Export timesheets to professionally formatted Excel and PDF files.
- English and German language support.
- Test mode for local development without Firebase.

## Tech Stack

- [Next.js](https://nextjs.org/) (with App Router)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [ShadCN UI](https://ui.shadcn.com/)
- [Firebase](https://firebase.google.com/) (Authentication & Firestore)
- [ExcelJS](https://github.com/exceljs/exceljs) for Excel exports

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
    *   Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
    *   In your project, go to Project Settings and add a new Web App.
    *   Copy the Firebase configuration credentials into your `.env.local` file.
4.  **Add Google Maps API Key:**
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   In the same project used for Firebase, navigate to "APIs & Services" > "Library" and enable the **Geocoding API**.
    *   Navigate to "APIs & Services" > "Credentials" and create a new API Key.
    *   Add this API key to your `.env.local` file.

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

## Deploying to Production (Firebase)

Deploying your application involves two main steps: deploying the app itself with **App Hosting**, and deploying the **Firestore Security Rules**.

### 1. Set Your Secrets for App Hosting

When you deploy your application to Firebase App Hosting, the variables in your local `.env.local` file are **not** automatically used. For security, you must set these values as secrets in your Firebase project.

You can do this using the Firebase CLI in your terminal. For each variable in your `.env.local` file, run the following command, replacing `SECRET_NAME` and `your_value_here` accordingly.

```bash
firebase apphosting:secrets:set SECRET_NAME
```

When prompted, enter the secret value (`your_value_here`). You will need to set the following secrets:

*   `NEXT_PUBLIC_ENVIRONMENT` (set this to `production`)
*   `NEXT_PUBLIC_FIREBASE_API_KEY`
*   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
*   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
*   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
*   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
*   `NEXT_PUBLIC_FIREBASE_APP_ID`
*   `GOOGLE_MAPS_API_KEY`
*   `NEXT_PUBLIC_FIREBASE_DATABASE_ID` (Optional: Only if you use a non-default database)

**Example:**
```bash
# This command will prompt you to enter the value for your API key
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_API_KEY
```

### 2. Deploy Your Application

After setting all your secrets, deploy your application to Firebase App Hosting:

```bash
firebase deploy --only apphosting
```

### 3. Deploy Firestore Security Rules

Your database is protected by security rules. This project includes a `firestore.rules` file that you must deploy to your project.

From your project's root directory, run the following command:

```bash
firebase deploy --only firestore:rules
```
This will publish the rules that allow users to read and write their own time entries.

---

## Troubleshooting

### Error: `Firestore... 400 (Bad Request)` or Permission Errors

This error usually means that either the necessary Google Cloud APIs are not enabled, or your Firestore security rules are blocking access.

**Solution:**

1.  **Enable Cloud APIs:**
    *   Make sure you are logged into the Google account associated with your Firebase project.
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/) for your project.
    *   Navigate to **APIs & Services > Library**.
    *   Search for and enable the following two APIs if they are not already active:
        *   **Cloud Firestore API**
        *   **Identity Toolkit API** (required for Firebase Authentication)
    *   **Important:** Many Google Cloud services, even those with a generous free tier, require a billing account to be linked to the project to function. Navigate to the **Billing** section in the Google Cloud Console and ensure your project is linked to a billing account.

2.  **Deploy Security Rules:**
    *   If you've just created your project, its database is locked down by default. You need to deploy the security rules included in this project.
    *   Run the following command from your project directory:
        ```bash
        firebase deploy --only firestore:rules
        ```
