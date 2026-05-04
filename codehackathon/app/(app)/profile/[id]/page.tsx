import { requireAuth } from '@/lib/auth/guards'
import { getUser } from '@/lib/db/queries/users'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Profile' }

export default async function ProfilePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  await requireAuth()

  const user = await getUser(id)
  if (!user) notFound()

  return (
    <div>
      <PageHeader
        title={user.displayName ?? 'User Profile'}
        description={`Member since ${new Date(user.createdAt).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}`}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Stats</CardTitle></CardHeader>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Role</dt>
              <dd><Badge variant={user.role === 'admin' ? 'admin' : user.role === 'moderator' ? 'moderator' : 'user'} label={user.role} /></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Trust Score</dt>
              <dd className="font-bold text-fuel-green">{user.trustScore}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Total Reports</dt>
              <dd className="font-medium">{user.reportCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Confirmed Reports</dt>
              <dd className="font-medium">{user.confirmedReportCount}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  )
}
