export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { setDevSessionCookie } from '@/lib/auth/session'
import { upsertUser } from '@/lib/firebase-admin/queries'

export async function POST(_request: NextRequest) {
  try {
    await setDevSessionCookie()

    await upsertUser({
      id: 'dev-user-123',
      displayName: 'Dev User',
      email: 'dev@test.com',
      photoURL: null,
      role: 'user',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Dev session creation failed:', error)
    return NextResponse.json({ error: 'Session creation failed' }, { status: 500 })
  }
}
