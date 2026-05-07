export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { setUserRole, verifyIdToken } from '@/lib/firebase-admin/auth'
import { resolveUserRole } from '@/lib/auth/superadmin'
import { setSessionCookie } from '@/lib/auth/session'
import { upsertUser } from '@/lib/firebase-admin/queries/users'

function roleToRedirect() {
  return '/dashboard'
}

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
    }

    const decoded = await verifyIdToken(idToken)
    console.log('Decoded Token:', { uid: decoded.uid, email: decoded.email, role: decoded.role })
    
    const role = resolveUserRole(decoded.email, decoded.role as string | undefined)
    console.log('Resolved Role:', role)

    if (role === 'superadmin' && decoded.role !== 'superadmin') {
      try {
        await setUserRole(decoded.uid, 'superadmin')
        console.log('Superadmin role assigned successfully')
      } catch (roleError) {
        console.error('Failed to set superadmin role:', roleError)
      }
    }

    await setSessionCookie(idToken)

    // Mirror user to Firestore — non-blocking so DB unavailability doesn't break auth
    upsertUser({
      id: decoded.uid,
      displayName: decoded.name ?? null,
      email: decoded.email ?? null,
      photoURL: decoded.picture ?? null,
      role: role === 'superadmin' ? 'admin' : role,
    }).catch((err) => console.error('[session] upsertUser failed:', err))

    return NextResponse.json({ success: true, role, redirectTo: roleToRedirect() })
  } catch (error) {
    console.error('[session] Session creation failed:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Unauthorized', detail: message }, { status: 401 })
  }
}
