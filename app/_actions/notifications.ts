'use server'

import { requireAuth } from '@/lib/auth/guards'

export async function subscribeToPushAction(_token: string) {
  await requireAuth()
  // no-op in mock mode — no Firestore pushSubscriptions writes
  return { success: true }
}

export async function unsubscribeFromPushAction() {
  await requireAuth()
  // no-op in mock mode
  return { success: true }
}
