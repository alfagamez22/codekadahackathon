import { auth } from 'firebase-functions/v1'
import sql from '../utils/db'
import { db } from '../utils/firestore-admin'

export const onUserCreatedHandler = auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user
  const nowIso = new Date().toISOString()

  await sql`
    INSERT INTO users (id, display_name, email, photo_url, role, trust_score, report_count, confirmed_report_count)
    VALUES (${uid}, ${displayName ?? null}, ${email ?? null}, ${photoURL ?? null}, 'user', 0, 0, 0)
    ON CONFLICT (id) DO NOTHING
  `

  await db.collection('users').doc(uid).set({
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
    mirroredAt: nowIso,
  }, { merge: true })

  console.log(`Mirrored new user ${uid} to PostgreSQL`)
})
