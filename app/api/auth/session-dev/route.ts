export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { setDevSessionCookie } from '@/lib/auth/session'
import { upsertUser } from '@/lib/db/queries/users'

export async function POST(request: NextRequest) {
  try {
    // Dev mode: Create simple dev session
    await setDevSessionCookie()

    // Create dev user in database
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
