#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Check if running in CI mode (less verbose logging)
const isCI = process.env.CI === 'true' || process.argv.includes('--ci')

// Helper function for conditional logging
const log = (message, force = false) => {
  if (force || !isCI) {
    console.log(message)
  }
}

// Fallback to dummy values if env vars are not loaded
if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  console.log(
    '⚠️  .env.local not found or Firebase config missing, using dummy Firebase config for emulator',
  )
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'dummy-api-key'
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'dummy-project.firebaseapp.com'
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'dummy-project-id'
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'dummy-project.appspot.com'
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789'
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'dummy-app-id'
}

const { initializeApp } = require('firebase/app')
const {
  getFirestore,
  doc,
  setDoc,
  connectFirestoreEmulator,
} = require('firebase/firestore')
const {
  getAuth,
  createUserWithEmailAndPassword,
  connectAuthEmulator,
  signInWithEmailAndPassword,
} = require('firebase/auth')

// Firebase config from environment variables (same as your main app)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Check if all required config values are present
const missingConfigKeys = Object.keys(firebaseConfig).filter(
  (key) => !firebaseConfig[key],
)
if (missingConfigKeys.length > 0) {
  console.error('❌ Missing Firebase config values:', missingConfigKeys)
  process.exit(1)
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

// Connect to emulators BEFORE any Firebase operations
log('🔌 Connecting to Firebase emulators...')
connectFirestoreEmulator(db, 'localhost', 8080)
connectAuthEmulator(auth, 'http://localhost:9099')
log('✅ Connected to emulators')

// Note: Emulators bypass Firestore security rules by default
log('🔓 Firestore security rules are bypassed in emulator mode')

// Sample data
const sampleUsers = [
  {
    email: 'test@example.com',
    password: 'password123',
    displayName: 'Test User',
  },
  {
    email: 'admin@example.com',
    password: 'password123',
    displayName: 'Admin User',
  },
  {
    email: 'user@example.com',
    password: 'password123',
    displayName: 'Regular User',
  },
]

// Sample data - just users for now

async function seedData() {
  try {
    log('Starting to seed Firebase emulator...')

    // Create users
    log('Creating sample users...')
    for (const userData of sampleUsers) {
      try {
        // Create auth user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          userData.email,
          userData.password,
        )

        log(`Created auth user: ${userData.email}`)

        // Sign in as this user to get proper auth context for Firestore writes
        await signInWithEmailAndPassword(
          auth,
          userData.email,
          userData.password,
        )

        // Create user document in Firestore (now with proper auth context)
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userData.email,
          displayName: userData.displayName,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        log(`Created user document: ${userData.email}`)

        // Sign out to create next user
        await auth.signOut()
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          log(`User ${userData.email} already exists`)
        } else {
          console.error(`Error creating user ${userData.email}:`, error.message)
        }
      }
    }

    // Note: Time entries and teams can be created manually in the app
    // or imported from production data using the export/import scripts

    log('Seeding completed successfully!')
    log('\nSample data created:')
    log(`   - ${sampleUsers.length} users`)
    log('\nSample login credentials:')
    sampleUsers.forEach((user) => {
      log(`   ${user.email} / ${user.password}`)
    })
    log('\nTo preserve this data between emulator sessions:')
    log('   1. Run: npm run emulators:export')
    log('   2. Restore with: npm run emulators:restore')
  } catch (error) {
    console.error('Error seeding data:', error)
    process.exit(1)
  }
}

// Run the seeding
seedData()
