import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true' || !firebaseConfig.apiKey;

// Conditionally initialize Firebase only if not in mock mode and API key is provided
if (!useMocks) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  auth = getAuth(app);
} else {
  // If in mock mode, create placeholder objects to avoid crashing on import.
  // The app's logic prevents these from actually being used.
  app = {} as FirebaseApp;
  db = {} as Firestore;
  auth = {} as Auth;
}

export { db, auth };
