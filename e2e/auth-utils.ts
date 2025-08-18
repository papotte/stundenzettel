import { deleteUser, signInWithEmailAndPassword } from '@firebase/auth'

import { type FirebaseApp, getApps, initializeApp } from 'firebase/app'
import {
  type Auth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
} from 'firebase/auth'
import {
  type Firestore,
  connectFirestoreEmulator,
  getFirestore,
} from 'firebase/firestore'

// Initialize Firebase client SDK (not Admin SDK)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dummy-api-key',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    'dummy-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'test-project',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'dummy-project.appspot.com',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'dummy-app-id',
}

let app: FirebaseApp
let auth: Auth
let db: Firestore

// Initialize Firebase if not already initialized
if (!getApps().length) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)

  // Connect to emulators for e2e tests
  if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'test') {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099')
      connectFirestoreEmulator(db, 'localhost', 8080)
      console.log('✅ Connected to Firebase emulators')
    } catch (error) {
      console.warn(
        '⚠️ Could not connect to emulators:',
        error instanceof Error ? error.message : String(error),
      )
    }
  }
} else {
  app = getApps()[0]
  auth = getAuth(app)
  db = getFirestore(app)
}

export interface TestUser {
  uid: string
  email: string
  password: string
}

/**
 * Creates a test user using Firebase client SDK (works with emulators)
 * This bypasses the UI registration flow entirely
 */
export async function createTestUser(
  email: string,
  password: string,
): Promise<TestUser> {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    )

    return {
      uid: userCredential.user.uid,
      email,
      password,
    }
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      // User already exists, try to sign in to get the actual UID
      try {
        const existingUser = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        )
        console.log(`Reusing existing test user: ${email}`)
        return {
          uid: existingUser.user.uid,
          email,
          password,
        }
      } catch (signInError: any) {
        console.warn(
          `Failed to sign in to existing user ${email}:`,
          signInError.message,
        )
        throw new Error(
          `User ${email} exists but cannot be accessed with provided password`,
        )
      }
    }
    throw error
  }
}

/**
 * Delete the test user
 */
export async function deleteTestUser(user: TestUser): Promise<void> {
  try {
    // Check if user exists and can be signed in
    const signedInUser = await signInWithEmailAndPassword(
      auth,
      user.email,
      user.password,
    )

    if (!signedInUser.user) {
      console.log(`User ${user.email} not found or already deleted`)
      return
    }

    // Delete user from Firebase Auth
    await deleteUser(signedInUser.user)
    console.log(`Successfully deleted test user: ${user.email}`)
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.log(`User ${user.email} was already deleted or never existed`)
    } else if (error.code === 'auth/invalid-credential') {
      console.log(
        `Invalid credentials for user ${user.email}, user may have been modified`,
      )
    } else {
      console.warn(
        `Failed to cleanup test user ${user.email}:`,
        error.message || error,
      )
    }
  }
}
