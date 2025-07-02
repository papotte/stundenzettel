import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  writeBatch,
  UpdateData,
} from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { TimeEntry } from '@/lib/types'

// Helper to convert Firestore Timestamps to JS Dates in a document
const fromFirestore = (docData: unknown): TimeEntry => {
  if (typeof docData !== 'object' || docData === null)
    throw new Error('Invalid Firestore data')
  const data = { ...(docData as Record<string, unknown>) }
  if (data.startTime && data.startTime instanceof Timestamp) {
    data.startTime = data.startTime.toDate()
  }
  if (data.endTime && data.endTime instanceof Timestamp) {
    data.endTime = data.endTime.toDate()
  }

  // Validate required fields before casting
  if (
    !('userId' in data) ||
    !('startTime' in data) ||
    !('location' in data)
  ) {
    throw new Error('Missing required TimeEntry fields')
  }
  return data as unknown as TimeEntry
}

const toFirestore = (entry: Partial<TimeEntry>): UpdateData<TimeEntry> => {
  const data: { [key: string]: unknown } = { ...entry }
  if (entry.startTime) {
    data.startTime = Timestamp.fromDate(entry.startTime)
  }
  // Firestore doesn't accept `undefined`, so we convert it to `null`.
  if ('endTime' in entry) {
    data.endTime = entry.endTime ? Timestamp.fromDate(entry.endTime) : null
  }
  // Don't save the id field in the document data
  if ('id' in data) delete data.id
  return data
}

export const addTimeEntry = async (
  entry: Omit<TimeEntry, 'id'>,
): Promise<string> => {
  if (!entry.userId) throw new Error('User not authenticated')
  const collectionRef = collection(db, 'users', entry.userId, 'timeEntries')
  const docRef = await addDoc(collectionRef, toFirestore(entry))
  return docRef.id
}

export const updateTimeEntry = async (
  entryId: string,
  entry: Partial<TimeEntry>,
): Promise<void> => {
  if (!entry.userId) throw new Error('User not authenticated')
  const docRef = doc(db, 'users', entry.userId, 'timeEntries', entryId)
  await updateDoc(docRef, toFirestore(entry))
}

export const deleteTimeEntry = async (
  userId: string,
  entryId: string,
): Promise<void> => {
  if (!userId) throw new Error('User not authenticated')
  const docRef = doc(db, 'users', userId, 'timeEntries', entryId)
  await deleteDoc(docRef)
}

export const getTimeEntries = async (userId: string): Promise<TimeEntry[]> => {
  if (!userId) return []
  const collectionRef = collection(db, 'users', userId, 'timeEntries')
  const q = query(collectionRef, orderBy('startTime', 'desc'))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    ...fromFirestore(doc.data()),
    id: doc.id,
  }))
}

export const deleteAllTimeEntries = async (userId: string): Promise<void> => {
  if (!userId) throw new Error('User not authenticated')
  const collectionRef = collection(db, 'users', userId, 'timeEntries')
  const querySnapshot = await getDocs(collectionRef)
  if (querySnapshot.empty) {
    return
  }
  const batch = writeBatch(db)
  querySnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })
  await batch.commit()
}
