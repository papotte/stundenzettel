#!/usr/bin/env node

/**
 * Migration: Copy displayName from users/{userId}/settings/general to users/{userId}
 *
 * Display name is now stored on the user document for public read access (team lists, etc.).
 * This script copies existing display names from settings to the user doc.
 *
 * Prerequisites:
 * - google-application-credentials.json in project root (or GOOGLE_APPLICATION_CREDENTIALS)
 * - Run from project root
 *
 * Usage:
 *   node scripts/migrate-display-name-to-user-doc.js
 */

const serviceAccount = require('../google-application-credentials.json')
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

initializeApp({
  credential: cert(serviceAccount),
})

const db = getFirestore('timewise')

async function migrate() {
  const snapshot = await db.collectionGroup('settings').get()
  let migrated = 0
  let skipped = 0

  for (const doc of snapshot.docs) {
    const data = doc.data()
    const displayName = (data.displayName ?? '').trim()

    if (!displayName) {
      skipped++
      continue
    }

    // doc.ref = users/{userId}/settings/general; parent.parent = users/{userId}
    const userRef = doc.ref.parent.parent
    if (!userRef) {
      skipped++
      continue
    }

    await userRef.set({ displayName }, { merge: true })
    migrated++
    console.log(`  Migrated: ${userRef.id} -> "${displayName}"`)
  }

  console.log(
    `\nMigration complete. Migrated ${migrated} users, skipped ${skipped} (no displayName or invalid path).`,
  )
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
