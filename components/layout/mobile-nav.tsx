'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { UserRole } from '@/types/auth'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: 'ri-home-4-line' },
  { href: '/stations/nearby', label: 'Nearby', icon: 'ri-map-pin-2-line' },
  { href: '/route-planner', label: 'Routes', icon: 'ri-compass-3-line' },
  { href: '/validate', label: 'Validate', icon: 'ri-checkbox-circle-line' },
]

export function MobileNav({ role }: { role?: UserRole }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isAdmin = role === 'admin' || role === 'superadmin'
  const activePanel = searchParams.get('panel')
  const items = isAdmin
    ? [...navItems, { href: '/dashboard?panel=overview', label: 'Admin', icon: 'ri-settings-4-line' }]
    : navItems

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
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
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium rounded-md transition-colors',
                isActive
                  ? 'text-[#0a0a0a] bg-[#f3f4f6] dark:text-[#f9fafb] dark:bg-[#1f2937]'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <i className={cn(item.icon, 'text-lg leading-none', isActive && 'font-bold')} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
