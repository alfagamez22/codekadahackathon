import 'server-only'

import type { UserRole } from '@/types/auth'

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null

  const normalized = email.trim().toLowerCase()
  return normalized || null
}

export function isSuperadminEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email)
  if (!normalized) return false

  const allowlist = (process.env.SUPERADMIN_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  return allowlist.includes(normalized)
}

export function resolveUserRole(
  email: string | null | undefined,
  claimedRole: string | null | undefined
): UserRole {
  if (isSuperadminEmail(email)) {
    return 'superadmin'
  }

  if (claimedRole === 'admin' || claimedRole === 'moderator' || claimedRole === 'user') {
    return claimedRole
  }

  return 'user'
}