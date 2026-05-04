'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/stations/nearby', label: 'Nearby', icon: '📍' },
  { href: '/route-planner', label: 'Route', icon: '🗺️' },
  { href: '/validate', label: 'Validate', icon: '✅' },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background md:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
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
