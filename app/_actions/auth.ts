'use server'

import { redirect } from 'next/navigation'
import { clearSessionCookie } from '@/lib/auth/session'
import { revokeRefreshTokens } from '@/lib/firebase-admin/auth'
import { readSession } from '@/lib/auth/session'

export async function signOutAction() {
  const session = await readSession()
  if (session) await revokeRefreshTokens(session.uid)
  await clearSessionCookie()
  redirect(session?.role === 'superadmin' ? '/superadmin' : '/login')
}
