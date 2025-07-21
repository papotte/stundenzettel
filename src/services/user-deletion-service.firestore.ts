import {
  EmailAuthProvider,
  GoogleAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
} from 'firebase/firestore'

import { auth, db } from '@/lib/firebase'

/**
 * Deletes all user data from Firestore and removes the Firebase Auth account.
 * This is a permanent operation that cannot be undone.
 */
export const deleteUserAccount = async (
  userId: string,
  password: string,
): Promise<void> => {
  if (!userId) throw new Error('User not authenticated')
  if (!password) throw new Error('Password is required for account deletion')

  const user = auth.currentUser
  if (!user || user.uid !== userId) {
    throw new Error('User not authenticated or mismatched user ID')
  }

  // Re-authenticate user before deletion for security
  if (user.email) {
    const credential = EmailAuthProvider.credential(user.email, password)
    await reauthenticateWithCredential(user, credential)
  }

  try {
    // Delete all user data from Firestore
    await deleteAllUserData(userId)

    // Delete the Firebase Auth user account
    await deleteUser(user)
  } catch (error) {
    console.error('Error during account deletion:', error)
    throw error
  }
}

/**
 * Deletes user account using Google re-authentication.
 * This is a permanent operation that cannot be undone.
 */
export const deleteUserAccountWithGoogle = async (
  userId: string,
): Promise<void> => {
  if (!userId) throw new Error('User not authenticated')

  const user = auth.currentUser
  if (!user || user.uid !== userId) {
    throw new Error('User not authenticated or mismatched user ID')
  }

  // Re-authenticate with Google before deletion for security
  const provider = new GoogleAuthProvider()
  await reauthenticateWithPopup(user, provider)

  try {
    // Delete all user data from Firestore
    await deleteAllUserData(userId)

    // Delete the Firebase Auth user account
    await deleteUser(user)
  } catch (error) {
    console.error('Error during account deletion:', error)
    throw error
  }
}

/**
 * Deletes user account using email confirmation as fallback.
 * This is a permanent operation that cannot be undone.
 */
export const deleteUserAccountWithEmail = async (
  userId: string,
  email: string,
): Promise<void> => {
  if (!userId) throw new Error('User not authenticated')
  if (!email) throw new Error('Email is required for account deletion')

  const user = auth.currentUser
  if (!user || user.uid !== userId) {
    throw new Error('User not authenticated or mismatched user ID')
  }

  // Verify email matches the current user
  if (user.email !== email) {
    throw new Error('Email does not match current user')
  }

  try {
    // Delete all user data from Firestore
    await deleteAllUserData(userId)

    // Delete the Firebase Auth user account
    await deleteUser(user)
  } catch (error) {
    console.error('Error during account deletion:', error)
    throw error
  }
}

/**
 * Deletes all user data from Firestore including settings and time entries.
 */
const deleteAllUserData = async (userId: string): Promise<void> => {
  const batch = writeBatch(db)

  // Delete user settings
  const settingsRef = doc(db, 'users', userId, 'settings', 'general')
  batch.delete(settingsRef)

  // Delete all time entries
  const timeEntriesRef = collection(db, 'users', userId, 'timeEntries')
  const timeEntriesSnapshot = await getDocs(timeEntriesRef)
  timeEntriesSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })

  // Delete any other user subcollections that might exist in the future
  // This ensures GDPR compliance by removing all user data

  // Commit all deletions in a single batch
  await batch.commit()

  // Delete the user document itself (this will also delete any remaining subcollections)
  const userDocRef = doc(db, 'users', userId)
  await deleteDoc(userDocRef)
}
