import Link from 'next/link'
import { readSession } from '@/lib/auth/session'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { Badge } from '@/components/ui/badge'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import type { UserRole } from '@/types/auth'

export async function Header() {
  const session = await readSession()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          <Link href={session ? '/dashboard' : '/'} className="flex items-center gap-2 font-bold text-fuel-green">
            <span className="text-xl">⛽</span>
            <span className="hidden sm:inline">Gas Price Tracker PH</span>
            <span className="sm:hidden">GasTracker</span>
          </Link>

          {session && (
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/dashboard" className="px-3 py-1.5 text-sm text-foreground hover:text-fuel-green hover:bg-green-50 rounded-lg transition-colors">Dashboard</Link>
              <Link href="/stations/nearby" className="px-3 py-1.5 text-sm text-foreground hover:text-fuel-green hover:bg-green-50 rounded-lg transition-colors">Nearby</Link>
              <Link href="/route-planner" className="px-3 py-1.5 text-sm text-foreground hover:text-fuel-green hover:bg-green-50 rounded-lg transition-colors">Routes</Link>
              <Link href="/validate" className="px-3 py-1.5 text-sm text-foreground hover:text-fuel-green hover:bg-green-50 rounded-lg transition-colors">Validate</Link>
              {(session.role === 'superadmin' || session.role === 'admin') && (
                <Link href="/dashboard?panel=overview" className="px-3 py-1.5 text-sm text-foreground hover:text-fuel-green hover:bg-green-50 rounded-lg transition-colors">
                  Admin
                </Link>
              )}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {session ? (
              <>
                <Badge variant={session.role as UserRole} />
                <SignOutButton />
              </>
            ) : (
              <GoogleSignInButton variant="primary" size="sm" className="w-auto" />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
