import { Timestamp, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { TimeEntry, UserSettings } from '@/lib/types'

/** Snapshot of a month's export as stored in Firestore (dates as Timestamps). */
export interface PublishedMonthSnapshot {
  publishedAt: ReturnType<typeof Timestamp.fromDate>
  entries: Array<{
    id: string
    userId: string
    startTime: ReturnType<typeof Timestamp.fromDate>
    endTime?: ReturnType<typeof Timestamp.fromDate> | null
    durationMinutes?: number
    location: string
    pauseDuration?: number
    driverTimeHours?: number
    passengerTimeHours?: number
  }>
  userSettings: UserSettings
}

/** Result of getPublishedMonth with dates restored. */
export interface PublishedMonthData {
  publishedAt: Date
  entries: TimeEntry[]
  userSettings: UserSettings
}

function entryToFirestore(
  entry: TimeEntry,
): PublishedMonthSnapshot['entries'][0] {
  const { id, userId, startTime, endTime, location, ...rest } = entry
  return {
    id,
    userId,
    startTime: Timestamp.fromDate(startTime),
    endTime: endTime ? Timestamp.fromDate(endTime) : null,
    location,
    ...rest,
  }
}

function entryFromFirestore(
  raw: PublishedMonthSnapshot['entries'][0],
  userId: string,
): TimeEntry {
  return {
    id: raw.id,
    userId,
    startTime: raw.startTime.toDate(),
    endTime: raw.endTime?.toDate(),
    location: raw.location,
    durationMinutes: raw.durationMinutes,
    pauseDuration: raw.pauseDuration,
    driverTimeHours: raw.driverTimeHours,
    passengerTimeHours: raw.passengerTimeHours,
  }
}

/**
 * Publish a month's timesheet for the team. Overwrites if already published.
 * Caller must be the member (userId); only they can write to their memberExports.
 */
export async function publishMonthForTeam(
  teamId: string,
  userId: string,
  monthKey: string,
  entries: TimeEntry[],
  userSettings: UserSettings,
): Promise<void> {
  const ref = doc(
    db,
    'teams',
    teamId,
    'memberExports',
    userId,
    'months',
    monthKey,
  )
  const snapshot: PublishedMonthSnapshot = {
    publishedAt: Timestamp.fromDate(new Date()),
    entries: entries.map(entryToFirestore),
    userSettings,
  }
  await setDoc(ref, snapshot)
}

/**
 * Get the published snapshot for a member/month, or null if not published.
 * Used by team reports UI (admin/owner) and by PDF route.
 */
export async function getPublishedMonth(
  teamId: string,
  memberId: string,
  monthKey: string,
): Promise<PublishedMonthData | null> {
  const ref = doc(
    db,
    'teams',
    teamId,
    'memberExports',
    memberId,
    'months',
    monthKey,
  )
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data() as PublishedMonthSnapshot
  return {
    publishedAt: data.publishedAt.toDate(),
    entries: data.entries.map((e) => entryFromFirestore(e, memberId)),
    userSettings: data.userSettings,
  }
}

/**
 * Remove the published snapshot for a member/month so admins can no longer see it.
 */
export async function unpublishMonth(
  teamId: string,
  memberId: string,
  monthKey: string,
): Promise<void> {
  const ref = doc(
    db,
    'teams',
    teamId,
    'memberExports',
    memberId,
    'months',
    monthKey,
  )
  await deleteDoc(ref)
}
