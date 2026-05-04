import Link from 'next/link'
import Image from 'next/image'
import { readSession } from '@/lib/auth/session'
import { signOutAction } from '@/app/_actions/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
              <Link href="/validate" className="px-3 py-1.5 text-sm text-foreground hover:text-fuel-green hover:bg-green-50 rounded-lg transition-colors">Validate</Link>
              {(session.role === 'admin' || session.role === 'moderator') && (
                <Link href={session.role === 'admin' ? '/admin' : '/moderator'} className="px-3 py-1.5 text-sm text-foreground hover:text-fuel-green hover:bg-green-50 rounded-lg transition-colors">
                  {session.role === 'admin' ? 'Admin' : 'Review'}
                </Link>
              )}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {session ? (
              <>
                <Badge variant={session.role as UserRole} />
                <form action={signOutAction}>
                  <Button type="submit" variant="ghost" size="sm">Sign out</Button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
