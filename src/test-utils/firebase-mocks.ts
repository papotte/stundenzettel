// Firebase mocking utilities for Jest tests
// This file contains all Firebase-related mocks to keep jest.setup.tsx clean

// Mock Firebase before any imports
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
}))

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    onAuthStateChanged: jest.fn(() => jest.fn()),
    signOut: jest.fn(),
    currentUser: null,
  })),
  connectAuthEmulator: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(() => jest.fn()),
}))

jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore')
  return {
    ...actual,
    getFirestore: jest.fn(() => ({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn(),
          set: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          onSnapshot: jest.fn(() => jest.fn()),
        })),
        add: jest.fn(),
        where: jest.fn(() => ({
          get: jest.fn(),
          onSnapshot: jest.fn(() => jest.fn()),
        })),
        orderBy: jest.fn(() => ({
          get: jest.fn(),
          onSnapshot: jest.fn(() => jest.fn()),
        })),
        limit: jest.fn(() => ({
          get: jest.fn(),
          onSnapshot: jest.fn(() => jest.fn()),
        })),
      })),
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        onSnapshot: jest.fn(() => jest.fn()),
      })),
      runTransaction: jest.fn(),
      batch: jest.fn(() => ({
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        commit: jest.fn(),
      })),
    })),
    connectFirestoreEmulator: jest.fn(),
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    addDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    onSnapshot: jest.fn(() => jest.fn()),
    runTransaction: jest.fn(),
    writeBatch: jest.fn(),
    serverTimestamp: jest.fn(() => new Date()),
    Timestamp: {
      now: jest.fn(() => new Date()),
      fromDate: jest.fn((date) => date),
      fromMillis: jest.fn((millis) => new Date(millis)),
    },
    FieldValue: {
      serverTimestamp: jest.fn(() => new Date()),
      delete: jest.fn(),
      arrayUnion: jest.fn(),
      arrayRemove: jest.fn(),
      increment: jest.fn(),
    },
    FirestoreError: class FirestoreError extends Error {
      constructor(
        public code: string,
        public message: string,
      ) {
        super(message)
        this.name = 'FirestoreError'
      }
    },
  }
})

// Mock the Firebase configuration module
jest.mock('@/lib/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        onSnapshot: jest.fn(() => jest.fn()),
      })),
      add: jest.fn(),
      where: jest.fn(() => ({
        get: jest.fn(),
        onSnapshot: jest.fn(() => jest.fn()),
      })),
      orderBy: jest.fn(() => ({
        get: jest.fn(),
        onSnapshot: jest.fn(() => jest.fn()),
      })),
      limit: jest.fn(() => ({
        get: jest.fn(),
        onSnapshot: jest.fn(() => jest.fn()),
      })),
    })),
    doc: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      onSnapshot: jest.fn(() => jest.fn()),
    })),
    runTransaction: jest.fn(),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn(),
    })),
  },
  auth: {
    onAuthStateChanged: jest.fn(() => jest.fn()),
    signOut: jest.fn(),
    currentUser: null,
  },
  TEST_COLLECTIONS: [
    'timeEntries',
    'teams',
    'teamMembers',
    'teamInvitations',
    'subscriptions',
    'userSettings',
    'notifications',
    'users',
  ],
}))
