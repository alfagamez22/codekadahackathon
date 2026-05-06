import 'server-only'
import { getAuth } from 'firebase-admin/auth'
import getAdminApp from './index'
import { resolveUserRole } from '@/lib/auth/superadmin'
import type { SessionUser, UserRole } from '@/types/auth'

async function getAdminAuth() {
  const app = await getAdminApp()
  return getAuth(app)
}

export async function verifyIdToken(idToken: string) {
  const auth = await getAdminAuth()
  return auth.verifyIdToken(idToken)
}

export async function verifySessionCookie(sessionCookie: string) {
  const auth = await getAdminAuth()
  return auth.verifySessionCookie(sessionCookie, true)
}

export async function createSessionCookie(idToken: string, expiresIn: number) {
  const auth = await getAdminAuth()
  return auth.createSessionCookie(idToken, { expiresIn })
}

export async function setUserRole(uid: string, role: UserRole) {
  const auth = await getAdminAuth()
  if (!auth) {
    console.error('getAdminAuth returned undefined/null in setUserRole')
    throw new Error('Firebase Admin Auth not initialized')
  }
  await auth.setCustomUserClaims(uid, { role })
}

export async function getAdminUser(uid: string) {
  const auth = await getAdminAuth()
  return auth.getUser(uid)
}

export async function revokeRefreshTokens(uid: string) {
  const auth = await getAdminAuth()
  await auth.revokeRefreshTokens(uid)
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
