import 'server-only'
import { getAuth } from 'firebase-admin/auth'
import getAdminApp from './index'
import { resolveUserRole } from '@/lib/auth/superadmin'
import type { SessionUser, UserRole } from '@/types/auth'

function getAdminAuth() {
  return getAuth(getAdminApp())
}

export async function verifyIdToken(idToken: string) {
  return getAdminAuth().verifyIdToken(idToken)
}

export async function verifySessionCookie(sessionCookie: string) {
  return getAdminAuth().verifySessionCookie(sessionCookie, true)
}

export async function createSessionCookie(idToken: string, expiresIn: number) {
  return getAdminAuth().createSessionCookie(idToken, { expiresIn })
}

export async function setUserRole(uid: string, role: UserRole) {
  await getAdminAuth().setCustomUserClaims(uid, { role })
}

export async function getAdminUser(uid: string) {
  return getAdminAuth().getUser(uid)
}

export async function revokeRefreshTokens(uid: string) {
  await getAdminAuth().revokeRefreshTokens(uid)
}

export async function getSessionUser(sessionCookie: string): Promise<SessionUser | null> {
  try {
    const decoded = await verifySessionCookie(sessionCookie)
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      displayName: decoded.name ?? null,
      photoURL: decoded.picture ?? null,
      role: resolveUserRole(decoded.email, decoded.role as string | undefined),
    }
  } catch {
    return null
  }
}
