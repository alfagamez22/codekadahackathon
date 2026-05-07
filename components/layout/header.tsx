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
          <Link href={session ? '/dashboard' : '/'} className="flex items-center gap-1.5 shrink-0">
            <span className="rounded-sm bg-[#16a34a] px-1.5 py-0.5 text-xs font-bold text-white leading-tight">GAS</span>
            <span className="text-sm font-semibold tracking-[-0.01em] text-foreground hidden sm:inline">TOS</span>
            <span className="text-sm font-semibold text-foreground sm:hidden">TOS</span>
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
