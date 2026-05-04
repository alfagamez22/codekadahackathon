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
    <aside className="w-48 shrink-0">
      <nav className="flex flex-col gap-1">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === href
                ? 'bg-fuel-green text-white'
                : 'text-foreground hover:bg-muted/20'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
