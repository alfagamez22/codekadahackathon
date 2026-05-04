import Link from 'next/link'
import { redirect } from 'next/navigation'
import { readSession } from '@/lib/auth/session'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Superadmin Access' }

export default async function SuperadminPage() {
  const session = await readSession()

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-sm">
          <Card padding="lg">
            <h1 className="text-xl font-bold text-foreground mb-1">Superadmin Access</h1>
            <p className="text-sm text-muted mb-6">
              Sign in with your allowlisted Google account to access privileged controls.
            </p>
            <GoogleSignInButton redirectTo="/superadmin" label="Continue with Google" />
          </Card>
        </div>
      </div>
    )
  }

  if (session.role !== 'superadmin') {
    redirect('/dashboard')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Superadmin</h1>
          <p className="mt-2 text-sm text-muted">
            This entry point is restricted to allowlisted Google accounts. From here you can open the existing admin tools.
          </p>
        </div>
        <Badge variant="superadmin" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <h2 className="text-lg font-semibold text-foreground">Admin Overview</h2>
          <p className="mt-2 text-sm text-muted">Open the current admin dashboard and system stats.</p>
          <Link href="/admin" className="mt-4 inline-flex">
            <Button>Open Admin</Button>
          </Link>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-foreground">User Roles</h2>
          <p className="mt-2 text-sm text-muted">Review current users and manage moderator or admin access.</p>
          <Link href="/admin/users" className="mt-4 inline-flex">
            <Button variant="secondary">Manage Users</Button>
          </Link>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-foreground">System Config</h2>
          <p className="mt-2 text-sm text-muted">Review validation thresholds and other runtime configuration.</p>
          <Link href="/admin/config" className="mt-4 inline-flex">
            <Button variant="secondary">Open Config</Button>
          </Link>
        </Card>
      </div>
    </div>
  )
}