import 'server-only'
import { cookies } from 'next/headers'
import { createSessionCookie, getSessionUser } from '@/lib/firebase-admin/auth'
import type { SessionUser } from '@/types/auth'

const SESSION_COOKIE_NAME = 'gas_tracker_session'
const SESSION_EXPIRY_MS = 14 * 24 * 60 * 60 * 1000 // 14 days

export async function setSessionCookie(idToken: string): Promise<void> {
  const sessionCookie = await createSessionCookie(idToken, SESSION_EXPIRY_MS)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    maxAge: SESSION_EXPIRY_MS / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function readSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!sessionCookie) return null
  return getSessionUser(sessionCookie)
}
