'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { UserRole } from '@/types/auth'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/stations/nearby', label: 'Nearby', icon: '📍' },
  { href: '/route-planner', label: 'Routes', icon: '🧭' },
  { href: '/validate', label: 'Validate', icon: '✅' },
]

export function MobileNav({ role }: { role?: UserRole }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isAdmin = role === 'admin' || role === 'superadmin'
  const activePanel = searchParams.get('panel')
  const items = isAdmin
    ? [...navItems, { href: '/dashboard?panel=overview', label: 'Admin', icon: '⚙️' }]
    : navItems

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background md:hidden">
      <div className="flex items-center justify-around px-2 py-1">
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
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                isActive ? 'text-fuel-green' : 'text-muted hover:text-foreground'
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
