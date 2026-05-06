'use server'

import { requireAuth, requireRole } from '@/lib/auth/guards'
import { upsertUser, updateUserRole } from '@/lib/firebase-admin/queries'
import { setUserRole } from '@/lib/firebase-admin/auth'
import { adminDb } from '@/lib/firebase-admin/firestore'
import type { UserRole } from '@/types/auth'

export async function updateProfileAction(data: { displayName?: string; photoURL?: string }) {
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

  await updateUserRole(targetUserId, role)
  await setUserRole(targetUserId, role)

  await adminDb.collection('auditLogs').add({
    adminId: session.uid,
    action: 'assign_role',
    targetType: 'user',
    targetId: targetUserId,
    after: { role },
    createdAt: new Date().toISOString(),
  })

  return { success: true }
}
