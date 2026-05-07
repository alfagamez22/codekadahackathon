import Link from 'next/link'
import { readSession } from '@/lib/auth/session'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { Badge } from '@/components/ui/badge'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { NavLinks } from '@/components/layout/nav-links'
import type { UserRole } from '@/types/auth'

export async function Header() {
  const session = await readSession()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href={session ? '/dashboard' : '/'}
            className="flex items-center gap-2 shrink-0"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#0a0a0a] dark:bg-[#f9fafb]">
              <i className="ri-gas-station-fill text-xs text-white dark:text-[#0a0a0a]" />
            </div>
            <span className="text-sm font-semibold tracking-[-0.01em] text-foreground hidden sm:inline">
              GASTOS
            </span>
          </Link>

          {/* Desktop nav */}
          {session && <NavLinks role={session.role as UserRole} />}

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
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
