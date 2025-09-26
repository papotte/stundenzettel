const serviceAccount = require('../google-application-credentials.json')
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

initializeApp({
  credential: cert(serviceAccount),
})

const db = getFirestore('timewise')

async function copyUserData(sourceUserId, targetUserId) {
  try {
    const sourceCollection = db
      .collection('users')
      .doc(sourceUserId)
      .collection('timeEntries')
    const targetCollection = db
      .collection('users')
      .doc(targetUserId)
      .collection('timeEntries')

    const snapshot = await sourceCollection.get()

    if (snapshot.empty) {
      console.log('No entries found for the source user.')
      return
    }

    const batch = db.batch()

    snapshot.forEach((doc) => {
      const targetDoc = targetCollection.doc(doc.id) // Use the same document ID
      console.log(doc.data())
      batch.set(targetDoc, doc.data()) // Copy data
    })

    await batch.commit()
    console.log('Entries copied successfully.')
  } catch (error) {
    console.error('Error copying entries:', error)
  }
}

const args = process.argv.slice(2)
if (args.length < 2) {
  console.error('Usage: node copy-entries.js <sourceUserId> <targetUserId>')
  process.exit(1)
}
const [sourceUser, targetUser] = args
copyUserData(sourceUser, targetUser).then(() => process.exit())
