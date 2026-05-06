import 'server-only'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '../firestore'
import type { UserProfile } from '@/types/auth'
import type { UserRole } from '@/types/auth'

export async function getUser(id: string): Promise<UserProfile | null> {
  const db = await getAdminDb()
  const snap = await db.collection('users').doc(id).get()
  if (!snap.exists) return null
  return snap.data() as UserProfile
}

export async function upsertUser(data: {
  id: string
  displayName?: string | null
  email?: string | null
  photoURL?: string | null
  role?: UserRole
}): Promise<void> {
  const db = await getAdminDb()
  const ref = db.collection('users').doc(data.id)
  const snap = await ref.get()
  const nowIso = new Date().toISOString()

  if (!snap.exists) {
    await ref.set({
      uid: data.id,
      displayName: data.displayName ?? null,
      email: data.email ?? null,
      photoURL: data.photoURL ?? null,
      role: data.role ?? 'user',
      trustScore: 0,
      reportCount: 0,
      confirmedReportCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    })
  } else {
    const updates: Record<string, unknown> = { updatedAt: nowIso }
    if (data.displayName !== undefined) updates.displayName = data.displayName
    if (data.email !== undefined) updates.email = data.email
    if (data.photoURL !== undefined) updates.photoURL = data.photoURL
    if (data.role !== undefined) updates.role = data.role
    await ref.update(updates)
  }
}

export async function updateUserRole(id: string, role: UserRole): Promise<void> {
  const db = await getAdminDb()
  await db.collection('users').doc(id).update({
    role,
    updatedAt: new Date().toISOString(),
  })
}

export async function incrementUserReportCount(id: string, confirmed = false): Promise<void> {
  const db = await getAdminDb()
  const updates: Record<string, unknown> = {
    reportCount: FieldValue.increment(1),
    updatedAt: new Date().toISOString(),
  }
  if (confirmed) {
    updates.confirmedReportCount = FieldValue.increment(1)
    updates.trustScore = FieldValue.increment(5)
  }
  await db.collection('users').doc(id).update(updates)
}

export async function listUsers(params: {
  page?: number
  pageSize?: number
  role?: UserRole
}): Promise<{ users: UserProfile[]; total: number }> {
  const { page = 1, pageSize = 20, role } = params

  const db = await getAdminDb()
  const snap = await db.collection('users').get()

  let all = snap.docs.map((d) => d.data() as UserProfile)

  if (role) all = all.filter((u) => u.role === role)

  all.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))

  const total = all.length
  const offset = (page - 1) * pageSize
  const users = all.slice(offset, offset + pageSize)

  return { users, total }
}
