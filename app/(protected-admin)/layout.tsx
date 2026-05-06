import { requireRole } from '@/lib/auth/guards'
import type { ReactNode } from 'react'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole(['admin'])

  return children
}
