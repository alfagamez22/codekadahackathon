import { requireRole } from '@/lib/auth/guards'
import type { ReactNode } from 'react'
import { AdminSidebar } from '@/components/layout/admin-sidebar'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole(['admin'])

  return (
    <div className="flex gap-6">
      <AdminSidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
