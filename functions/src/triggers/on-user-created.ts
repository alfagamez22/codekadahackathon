import { onUserCreated } from 'firebase-functions/v2/identity'
import sql from '../utils/db'

export const onUserCreatedHandler = onUserCreated(async (event) => {
  const { uid, email, displayName, photoURL } = event.data

  await sql`
    INSERT INTO users (id, display_name, email, photo_url, role, trust_score, report_count, confirmed_report_count)
    VALUES (${uid}, ${displayName ?? null}, ${email ?? null}, ${photoURL ?? null}, 'user', 0, 0, 0)
    ON CONFLICT (id) DO NOTHING
  `

  console.log(`Mirrored new user ${uid} to PostgreSQL`)
})
