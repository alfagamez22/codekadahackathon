export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin/auth'
import { setSessionCookie } from '@/lib/auth/session'
import { upsertUser } from '@/lib/db/queries/users'

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
    }

    const decoded = await verifyIdToken(idToken)
    await setSessionCookie(idToken)

    // Mirror user to PostgreSQL on first auth
    await upsertUser({
      id: decoded.uid,
      displayName: decoded.name ?? null,
      email: decoded.email ?? null,
      photoURL: decoded.picture ?? null,
      role: (decoded.role as 'user' | 'moderator' | 'admin') ?? 'user',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Session creation failed:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
