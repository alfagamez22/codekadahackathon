import 'server-only'
import sql from '../index'
import type { UserProfile } from '@/types/auth'
import type { UserRole } from '@/types/auth'

export async function getUser(id: string): Promise<UserProfile | null> {
  const rows = await sql<UserProfile[]>`
    SELECT
      id AS uid,
      display_name AS "displayName",
      email,
      photo_url AS "photoURL",
      role,
      trust_score AS "trustScore",
      report_count AS "reportCount",
      confirmed_report_count AS "confirmedReportCount",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM users
    WHERE id = ${id}
  `
  return rows[0] ?? null
}

export async function upsertUser(data: {
  id: string
  displayName?: string | null
  email?: string | null
  photoURL?: string | null
  role?: UserRole
}): Promise<void> {
  await sql`
    INSERT INTO users (id, display_name, email, photo_url, role)
    VALUES (${data.id}, ${data.displayName ?? null}, ${data.email ?? null}, ${data.photoURL ?? null}, ${data.role ?? 'user'})
    ON CONFLICT (id) DO UPDATE SET
      display_name = COALESCE(EXCLUDED.display_name, users.display_name),
      email = COALESCE(EXCLUDED.email, users.email),
      photo_url = COALESCE(EXCLUDED.photo_url, users.photo_url),
      updated_at = now()
  `
}

export async function updateUserRole(id: string, role: UserRole): Promise<void> {
  await sql`UPDATE users SET role = ${role}, updated_at = now() WHERE id = ${id}`
}

export async function incrementUserReportCount(id: string, confirmed = false): Promise<void> {
  if (confirmed) {
    await sql`
      UPDATE users SET
        report_count = report_count + 1,
        confirmed_report_count = confirmed_report_count + 1,
        trust_score = trust_score + 5,
        updated_at = now()
      WHERE id = ${id}
    `
  } else {
    await sql`
      UPDATE users SET report_count = report_count + 1, updated_at = now()
      WHERE id = ${id}
    `
  }
}

export async function listUsers(params: {
  page?: number
  pageSize?: number
  role?: UserRole
}): Promise<{ users: UserProfile[]; total: number }> {
  const { page = 1, pageSize = 20, role } = params
  const offset = (page - 1) * pageSize

  const rows = await sql<(UserProfile & { total: string })[]>`
    SELECT
      id AS uid,
      display_name AS "displayName",
      email,
      photo_url AS "photoURL",
      role,
      trust_score AS "trustScore",
      report_count AS "reportCount",
      confirmed_report_count AS "confirmedReportCount",
      created_at AS "createdAt",
      updated_at AS "updatedAt",
      COUNT(*) OVER() AS total
    FROM users
    ${role ? sql`WHERE role = ${role}` : sql``}
    ORDER BY created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `

  const total = rows[0] ? parseInt(rows[0].total as unknown as string, 10) : 0
  return { users: rows as unknown as UserProfile[], total }
}
