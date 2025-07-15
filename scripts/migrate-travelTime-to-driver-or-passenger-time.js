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
  let cleaned = 0

  for (const doc of snapshot.docs) {
    const data = doc.data()
    let updateObj = {}
    let needsUpdate = false

    // Migration: travelTime/isDriver -> driverTimeHours/passengerTimeHours
    if (data.travelTime !== undefined) {
      if (data.isDriver === true) {
        updateObj.driverTimeHours = data.travelTime
        updateObj.passengerTimeHours = 0
      } else if (data.isDriver === false) {
        updateObj.driverTimeHours = 0
        updateObj.passengerTimeHours = data.travelTime
      }
      needsUpdate = true
    }

    // Remove old fields if present
    if ('drivingTime' in data || 'travelTime' in data || 'isDriver' in data) {
      updateObj.drivingTime = admin.firestore.FieldValue.delete()
      updateObj.travelTime = admin.firestore.FieldValue.delete()
      updateObj.isDriver = admin.firestore.FieldValue.delete()
      needsUpdate = true
      cleaned++
    }

    if (needsUpdate) {
      await doc.ref.update(updateObj)
      updated++
    }
  }
  console.log(
    `Migration complete. Updated ${updated} documents. Cleaned ${cleaned} documents (removed drivingTime/travelTime/isDriver).`,
  )
}

const admin = require('firebase-admin')
migrate().then(() => process.exit())
