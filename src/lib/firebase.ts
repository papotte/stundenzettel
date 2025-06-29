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

const useMocks = process.env.NEXT_PUBLIC_ENVIRONMENT === 'test' || process.env.NEXT_PUBLIC_ENVIRONMENT === 'development';

if (useMocks) {
  // If in mock mode, create placeholder objects to avoid crashing on import.
  // The app's logic prevents these from actually being used.
  app = {} as FirebaseApp;
  db = {} as Firestore;
  auth = {} as Auth;
} else {
  // In a non-mock environment, check if all Firebase config keys are present.
  const missingConfigKeys = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);

  if (missingConfigKeys.length > 0) {
    console.error(`Firebase configuration is incomplete. The following environment variables are missing: ${missingConfigKeys.join(", ")}. Please set these as secrets in your Firebase Hosting environment. Refer to the README.md for instructions.`);
    // Set dummy objects to prevent app from crashing on import
    app = {} as FirebaseApp;
    db = {} as Firestore;
    auth = {} as Auth;
  } else {
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      db = getFirestore(app);
      auth = getAuth(app);
  }
}

export { db, auth };
