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
  // Only initialize if API key is present.
  if (firebaseConfig.apiKey) {
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      db = getFirestore(app);
      auth = getAuth(app);
  } else {
      console.warn("Firebase config not found, and not in mock mode. Firebase features will be disabled. Create a .env.local file with your Firebase credentials to enable them.");
      app = {} as FirebaseApp;
      db = {} as Firestore;
      auth = {} as Auth;
  }
}


export { db, auth };
