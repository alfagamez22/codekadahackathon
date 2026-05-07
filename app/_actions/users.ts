'use server'

import { requireAuth, requireRole } from '@/lib/auth/guards'
import { updateUserRole as dbUpdateUserRole } from '@/lib/firebase-admin/queries/users'
import { setUserRole } from '@/lib/firebase-admin/auth'
import { getAdminDb } from '@/lib/firebase-admin/firestore'
import { upsertUser } from '@/lib/firebase-admin/queries/users'
import type { UserRole } from '@/types/auth'

async function getAdminDb() {
  const app = await getAdminApp()
  return getFirestore(app)
}

export async function updateProfileAction(data: {
  displayName?: string
  photoURL?: string
}) {
  const session = await requireAuth()
  await upsertUser({
    id: session.uid,
    displayName: data.displayName,
    photoURL: data.photoURL,
  })
  return { success: true }
}

export async function assignRoleAction(targetUserId: string, role: UserRole) {
  const session = await requireRole(['admin'])

  await dbUpdateUserRole(targetUserId, role)
  await setUserRole(targetUserId, role)

  const db = await getAdminDb()
  await db.collection('auditLogs').add({
  const db = await getAdminDb()
  await db.collection('auditLogs').add({
    adminId: session.uid,
    action: 'assign_role',
    targetType: 'user',
    targetId: targetUserId,
    after: { role },
    createdAt: new Date().toISOString(),
  })

  return { success: true }
}
