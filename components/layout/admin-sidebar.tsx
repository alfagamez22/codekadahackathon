'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/admin', label: '📊 Overview' },
  { href: '/admin/users', label: '👥 Users' },
  { href: '/admin/stations', label: '⛽ Stations' },
  { href: '/admin/config', label: '⚙️ Config' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 sticky top-20">
      <div className="rounded-2xl border border-border bg-card p-3">
        <p className="px-2 pb-2 text-xs uppercase tracking-wide text-muted">Admin</p>
      <nav className="flex flex-col gap-1">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
