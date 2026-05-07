'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/stations', label: 'Stations' },
  { href: '/admin/config', label: 'Config' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-56">
      <div className="rounded-xl border border-border bg-card p-2 lg:p-3">
        <p className="hidden px-2 pb-2 text-xs uppercase tracking-wide text-muted lg:block">Admin</p>
      <nav className="flex gap-1 overflow-x-auto lg:flex-col">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === href
                ? 'bg-fuel-green text-white shadow-sm'
                : 'text-foreground hover:bg-muted/30'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      </div>
    </aside>
  )
}
