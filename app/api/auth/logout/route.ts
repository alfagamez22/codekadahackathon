export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { readSession, clearSessionCookie } from '@/lib/auth/session'
import { revokeRefreshTokens } from '@/lib/firebase-admin/auth'

export async function POST() {
  try {
    const session = await readSession()
    if (session) {
      await revokeRefreshTokens(session.uid)
    }
  } catch (error) {
    // Always continue logout locally even if token revocation fails.
    console.error('Failed to revoke refresh tokens during logout:', error)
  }

  await clearSessionCookie()

  return NextResponse.json({ success: true })
}
