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
  try {
    // Always use test-database and emulators for e2e helpers
    db = getFirestore(app, 'test-database')
    connectAuthEmulator(auth, 'http://localhost:9099')
    connectFirestoreEmulator(db, 'localhost', 8080)
    // connected to emulators
  } catch (error) {
    console.warn(
      '⚠️ Could not connect to emulators:',
      error instanceof Error ? error.message : String(error),
    )
  }
} else {
  app = getApps()[0]
  auth = getAuth(app)
  // Ensure we're using test-database and emulator connections
  db = getFirestore(app, 'test-database')
  try {
    connectAuthEmulator(auth, 'http://localhost:9099')
    connectFirestoreEmulator(db, 'localhost', 8080)
    // connected to emulators (existing app)
  } catch (error) {
    console.warn(
      '⚠️ Could not connect to emulators for existing app:',
      error instanceof Error ? error.message : String(error),
    )
  }
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
        // reuse existing test user
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
    // deleted test user
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

/**
 * Cleans up only the data for a specific user using the emulator REST API
 * This allows tests to run in parallel without interfering with each other
 */
export async function cleanupUserData(userId: string): Promise<void> {
  try {
    const projectId =
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'timewise-tracker-61lqb'
    const emulatorHost = 'localhost:8080'
    const databaseId = 'test-database'

    // Delete user-specific collections
    const userCollections = [
      `users/${userId}/timeEntries`,
      `users/${userId}/settings`,
      `user-teams/${userId}`,
    ]

    for (const collectionPath of userCollections) {
      const clearUrl = `http://${emulatorHost}/emulator/v1/projects/${projectId}/databases/${databaseId}/documents/${collectionPath}`

      const response = await fetch(clearUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        console.log(`✅ Cleared user collection: ${collectionPath}`)
      } else if (response.status === 404) {
        // Collection doesn't exist, which is fine
        console.log(`ℹ️ Collection doesn't exist: ${collectionPath}`)
      } else {
        const errorText = await response.text()
        console.warn(
          `⚠️ Failed to clear ${collectionPath}: ${response.status} ${errorText}`,
        )
      }
    }

    console.log(`✅ User data cleanup completed for user: ${userId}`)
  } catch (error) {
    console.error('❌ User data cleanup failed:', error)
    throw error
  }
}

/**
 * Cleans up the test database using the emulator REST API
 * This bypasses security rules entirely by using the emulator REST API
 * Used for global cleanup at the start of test runs
 */
export async function cleanupTestDatabaseWithAdmin(): Promise<void> {
  try {
    const projectId =
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'timewise-tracker-61lqb'
    const emulatorHost = 'localhost:8080'
    const databaseId = 'test-database'

    const clearUrl = `http://${emulatorHost}/emulator/v1/projects/${projectId}/databases/${databaseId}/documents`
    // Shell alternative…
    // curl -v -X DELETE "http://localhost:8080/emulator/v1/projects/timewise-tracker-61lqb/databases/test-database/documents"

    const response = await fetch(clearUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      console.log('✅ Test database cleared successfully')
    } else {
      const errorText = await response.text()
      console.error(
        `❌ Failed to clear emulator data: ${response.status} ${errorText}`,
      )
      throw new Error(
        `Failed to clear emulator data: ${response.status} - ${errorText}`,
      )
    }
  } catch (error) {
    console.error('❌ Database cleanup failed:', error)
    throw error
  }
}
