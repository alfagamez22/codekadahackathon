import 'server-only'
import { redirect } from 'next/navigation'
import { readSession } from './session'
import type { SessionUser, UserRole } from '@/types/auth'

export async function requireAuth(): Promise<SessionUser> {
  const session = await readSession()
  if (!session) redirect('/auth/login')
  return session
}

export async function requireRole(allowedRoles: UserRole[]): Promise<SessionUser> {
  const session = await requireAuth()
  if (!allowedRoles.includes(session.role)) redirect('/dashboard')
  return session
}

export async function getOptionalSession(): Promise<SessionUser | null> {
  return readSession()
}
