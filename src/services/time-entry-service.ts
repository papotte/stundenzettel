import { db } from "@/lib/firebase";
import type { TimeEntry } from "@/lib/types";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  orderBy,
  writeBatch,
} from "firebase/firestore";

const timeEntriesCollection = collection(db, "timeEntries");

// Helper to convert Firestore Timestamps to JS Dates in a document
const fromFirestore = (docData: any): TimeEntry => {
    const data = { ...docData };
    if (data.startTime && data.startTime instanceof Timestamp) {
        data.startTime = data.startTime.toDate();
    }
    if (data.endTime && data.endTime instanceof Timestamp) {
        data.endTime = data.endTime.toDate();
    }
    return data as TimeEntry;
}

const toFirestore = (entry: Partial<TimeEntry>) => {
    const data: { [key: string]: any } = { ...entry };
    if (entry.startTime) {
        data.startTime = Timestamp.fromDate(entry.startTime);
    }
    // Firestore doesn't accept `undefined`, so we convert it to `null`.
    if ('endTime' in entry) {
        data.endTime = entry.endTime ? Timestamp.fromDate(entry.endTime) : null;
    }
    return data;
}

export const addTimeEntry = async (entry: Omit<TimeEntry, 'id'>): Promise<string> => {
  const docRef = await addDoc(timeEntriesCollection, toFirestore(entry));
  return docRef.id;
};

export const updateTimeEntry = async (id: string, entry: Partial<TimeEntry>): Promise<void> => {
  const docRef = doc(db, "timeEntries", id);
  await updateDoc(docRef, toFirestore(entry));
};

export const deleteTimeEntry = async (id: string): Promise<void> => {
  const docRef = doc(db, "timeEntries", id);
  await deleteDoc(docRef);
};

export const getTimeEntries = async (): Promise<TimeEntry[]> => {
  const q = query(timeEntriesCollection, orderBy("startTime", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...fromFirestore(doc.data()),
  }));
};

export const deleteAllTimeEntries = async (): Promise<void> => {
    const querySnapshot = await getDocs(timeEntriesCollection);
    if (querySnapshot.empty) {
        return;
    }
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}
