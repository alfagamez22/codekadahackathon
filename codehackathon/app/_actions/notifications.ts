'use server'

import { requireAuth } from '@/lib/auth/guards'
import { adminDb } from '@/lib/firebase-admin/firestore'

export async function subscribeToPushAction(token: string) {
  const session = await requireAuth()

  await adminDb.collection('pushSubscriptions').doc(session.uid).set({
    userId: session.uid,
    token,
    updatedAt: new Date().toISOString(),
  })

  return { success: true }
}

export async function unsubscribeFromPushAction() {
  const session = await requireAuth()
  await adminDb.collection('pushSubscriptions').doc(session.uid).delete()
  return { success: true }
}
