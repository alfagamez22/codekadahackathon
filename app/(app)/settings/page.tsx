import { requireAuth } from '@/lib/auth/guards'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { PushNotificationManager } from '@/components/pwa/push-notification-manager'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const session = await requireAuth()

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account preferences" />

      <div className="flex flex-col gap-6 max-w-lg">
        <Card>
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <dl className="flex flex-col gap-3 text-sm">
            <div><dt className="text-muted">Email</dt><dd className="font-medium">{session.email ?? '—'}</dd></div>
            <div><dt className="text-muted">Name</dt><dd className="font-medium">{session.displayName ?? '—'}</dd></div>
            <div><dt className="text-muted">Role</dt><dd className="font-medium capitalize">{session.role}</dd></div>
          </dl>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <PushNotificationManager />
        </Card>
      </div>
    </div>
  )
}
