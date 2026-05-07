'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin', label: 'Overview', icon: 'ri-dashboard-line' },
  { href: '/admin/users', label: 'Users', icon: 'ri-group-line' },
  { href: '/admin/stations', label: 'Stations', icon: 'ri-gas-station-line' },
  { href: '/admin/config', label: 'Config', icon: 'ri-settings-4-line' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-52">
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <p className="hidden px-3 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border lg:block">
          Admin Panel
        </p>
        <nav className="flex gap-1 p-1 overflow-x-auto lg:flex-col lg:gap-0 lg:p-1">
          {links.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'shrink-0 flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === href
                  ? 'bg-[#f3f4f6] text-[#0a0a0a] dark:bg-[#1f2937] dark:text-[#f9fafb]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-[#f9fafb] dark:hover:bg-[#1f2937]',
              )}
            >
              <i className={cn(icon, 'text-base')} />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}
