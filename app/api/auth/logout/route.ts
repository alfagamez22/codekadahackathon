export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { readSession, clearSessionCookie } from '@/lib/auth/session'
import { revokeRefreshTokens } from '@/lib/firebase-admin/auth'

export async function POST() {
  const session = await readSession()
  if (session) {
    await revokeRefreshTokens(session.uid)
  }

  await clearSessionCookie()

  return NextResponse.json({ success: true })
}
