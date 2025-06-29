# TimeWise Tracker

A Next.js application for effortless time tracking, designed for Firebase Studio.

## Features

- Live time tracking with location input.
- Manual time entry and editing.
- Special entry types for Sick Leave, PTO, and Bank Holidays.
- Daily, weekly, and monthly time summaries.
- Export timesheets to professionally formatted Excel and PDF files.
- English and German language support.
- Mock mode for local development without Firebase.

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

### 1. Installation

Clone the repository and install the project dependencies.

```bash
npm install
```

### 2. Environment Configuration

The application can run in two modes: **Mock Mode** (for local development without external services) or **Firebase Mode** (requires a Firebase project).

#### Option A: Running in Mock Mode (Recommended for UI development)

To run the app with pre-populated sample data without connecting to any external services, create a `.env.local` file in the root of your project and add the following line:

```env
NEXT_PUBLIC_USE_MOCKS=true
```

This will automatically load sample data and bypass the Firebase login screen.

#### Option B: Running with Firebase and Google Cloud

To use the full features of the application, you need to connect it to your own Firebase project and enable the Google Maps Geocoding API.

1.  **Create a `.env.local` file** in the root of the project.
2.  **Set up Firebase:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
    *   In your project, go to Project Settings and add a new Web App.
    *   Copy the Firebase configuration credentials into your `.env.local` file.
3.  **Set up Google Maps Geocoding API:**
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   In the same project used for Firebase, navigate to "APIs & Services" > "Library" and enable the **Geocoding API**.
    *   Navigate to "APIs & Services" > "Credentials" and create a new API Key.
    *   Add this API key to your `.env.local` file.

Your `.env.local` file should look like this:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Maps Geocoding API Key
# Used for the "Get current location" feature
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

**Note:** Do not set `NEXT_PUBLIC_USE_MOCKS=true` if you are configuring Firebase credentials.

### 3. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002).
