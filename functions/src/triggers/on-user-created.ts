import { auth } from 'firebase-functions/v1'
import { db } from '../utils/firestore-admin'

export const onUserCreatedHandler = auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user
  const nowIso = new Date().toISOString()

  await db.collection('users').doc(uid).set(
    {
      uid,
      email: email ?? null,
      displayName: displayName ?? null,
      photoURL: photoURL ?? null,
      role: 'user',
      trustScore: 0,
      reportCount: 0,
      confirmedReportCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    { merge: true },
  )

  console.log(`Created user document for ${uid}`)
})
