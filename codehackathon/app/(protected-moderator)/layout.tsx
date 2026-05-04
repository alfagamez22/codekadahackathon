import { requireRole } from '@/lib/auth/guards'
import type { ReactNode } from 'react'

export default async function ModeratorLayout({ children }: { children: ReactNode }) {
  await requireRole(['admin', 'moderator'])
  return <>{children}</>
}
