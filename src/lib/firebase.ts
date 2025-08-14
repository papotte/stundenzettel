import { type FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app'
import { type Auth, connectAuthEmulator, getAuth } from 'firebase/auth'
import {
  type Firestore,
  connectFirestoreEmulator,
  getFirestore,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp
let db: Firestore
let auth: Auth

// Determine database ID based on environment
const getDatabaseId = (): string => {
  const customDatabaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID

  // If a custom database ID is explicitly set, use it
  if (customDatabaseId) {
    return customDatabaseId
  }

  return '' // Empty string means default database
}

// Always initialize Firebase (no more mock mode for database)
{
  // In a non-mock environment, check if all Firebase config keys are present.
  const requiredConfigKeys = Object.keys(firebaseConfig) as Array<
    keyof typeof firebaseConfig
  >
  const missingConfigKeys = requiredConfigKeys
    .filter((key) => !firebaseConfig[key])
    .map(
      (key) =>
        `NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`,
    )

  if (missingConfigKeys.length > 0) {
    console.error(
      `Firebase configuration is incomplete. The following environment variables are missing: ${missingConfigKeys.join(', ')}. Please set these as secrets in your Firebase Hosting environment. Refer to the README.md for instructions.`,
    )
    // Set dummy objects to prevent app from crashing on import
    app = {} as FirebaseApp
    db = {} as Firestore
    auth = {} as Auth
  } else {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

    // Check if we should connect to emulators (use development/test environment)
    const useEmulators =
      process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' ||
      process.env.NEXT_PUBLIC_ENVIRONMENT === 'test'

    if (useEmulators) {
      // Connect to emulators
      const databaseId = getDatabaseId()
      db = getFirestore(app, databaseId)
      connectFirestoreEmulator(db, 'localhost', 8080)

      // Connect Auth emulator
      auth = getAuth(app)
      connectAuthEmulator(auth, 'http://localhost:9099')
    } else {
      // Connect to real Firebase services
      const databaseId = getDatabaseId()
      db = getFirestore(app, databaseId)

      // Auth remains the same for all environments
      auth = getAuth(app)
    }
  }
}

export { db, auth }
