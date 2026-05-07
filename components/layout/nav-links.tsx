'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/auth'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/stations/nearby', label: 'Nearby' },
  { href: '/route-planner', label: 'Routes' },
  { href: '/validate', label: 'Validate' },
]

export function NavLinks({ role }: { role?: UserRole }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activePanel = searchParams.get('panel')
  const isAdmin = role === 'admin' || role === 'superadmin'

  const items = isAdmin
    ? [...navItems, { href: '/dashboard?panel=overview', label: 'Admin' }]
    : navItems

  return (
    <nav className="hidden md:flex items-center gap-1">
      {items.map((item) => {
        const itemPath = item.href.split('?')[0]
        const isAdminItem = item.href.includes('panel=')
        const isDashboardHome = item.href === '/dashboard'
        const isActive = isAdminItem
          ? pathname === '/dashboard' && activePanel != null
          : isDashboardHome
            ? pathname === '/dashboard' && activePanel == null
            : pathname.startsWith(itemPath)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
