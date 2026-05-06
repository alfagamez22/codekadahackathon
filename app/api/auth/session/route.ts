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

    const userData = {
      id: decoded.uid,
      displayName: decoded.name ?? null,
      email: decoded.email ?? null,
      photoURL: decoded.picture ?? null,
      role: role === 'superadmin' ? 'admin' : role,
    }

    // Attempt PostgreSQL Mirroring (Optional/Best Effort)
    try {
      await upsertUser(userData)
      console.log('User upserted to PostgreSQL successfully')
    } catch (dbError) {
      console.warn('PostgreSQL upsert failed (DB might be offline), falling back to Firestore-only mirror:', dbError)
      
      // FALLBACK: Directly mirror to Firestore if SQL is down
      try {
        const { mirrorUserToFirestore } = await import('@/lib/firebase-admin/sql-mirror')
        await mirrorUserToFirestore({
          uid: userData.id,
          displayName: userData.displayName,
          email: userData.email,
          photoURL: userData.photoURL,
          role: userData.role as any,
          trustScore: 0,
          reportCount: 0,
          confirmedReportCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        console.log('User mirrored to Firestore directly (SQL fallback)')
      } catch (mirrorError) {
        console.error('Final fallback mirror to Firestore failed:', mirrorError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Session creation failed:', error)
    return NextResponse.json({ 
      error: 'Unauthorized',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 401 })
  }
}
