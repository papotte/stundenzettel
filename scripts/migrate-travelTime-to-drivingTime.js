const serviceAccount = require('../google-application-credentials.json')
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

initializeApp({
  credential: cert(serviceAccount),
})

// Use named Firestore database 'timewise'
const db = getFirestore('timewise')

async function migrate() {
  const snapshot = await db.collectionGroup('timeEntries').get()
  let updated = 0

  for (const doc of snapshot.docs) {
    const data = doc.data()
    if (data.travelTime !== undefined && data.drivingTime === undefined) {
      await doc.ref.update({
        drivingTime: data.travelTime,
      })
      updated++
    }
  }
  console.log(`Migration complete. Updated ${updated} documents.`)
}

migrate().then(() => process.exit())
