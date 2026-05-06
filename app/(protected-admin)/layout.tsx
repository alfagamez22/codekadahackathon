import { requireRole } from '@/lib/auth/guards'
import type { ReactNode } from 'react'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { Badge } from '@/components/ui/badge'
import type { UserRole } from '@/types/auth'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireRole(['admin'])

  return (
    <div className="flex gap-6 items-start">
      <AdminSidebar />
      <main className="flex-1 min-w-0">
        <div className="mb-6 rounded-2xl border border-border bg-card px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Operations</p>
              <h2 className="text-sm font-semibold text-foreground">Admin Control Center</h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={session.role as UserRole} />
              <SignOutButton redirectTo={session.role === 'superadmin' ? '/superadmin' : '/login'} />
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}
