export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { setUserRole, verifyIdToken } from '@/lib/firebase-admin/auth'
import { resolveUserRole } from '@/lib/auth/superadmin'
import { setSessionCookie } from '@/lib/auth/session'
import { upsertUser } from '@/lib/db/queries/users'

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
    }

    const decoded = await verifyIdToken(idToken)
    const role = resolveUserRole(decoded.email, decoded.role as string | undefined)

    if (role === 'superadmin' && decoded.role !== 'superadmin') {
      await setUserRole(decoded.uid, 'superadmin')
    }

    await setSessionCookie(idToken)

    // Mirror user to PostgreSQL on first auth
    await upsertUser({
      id: decoded.uid,
      displayName: decoded.name ?? null,
      email: decoded.email ?? null,
      photoURL: decoded.picture ?? null,
      role: role === 'superadmin' ? 'admin' : role,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Session creation failed:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
