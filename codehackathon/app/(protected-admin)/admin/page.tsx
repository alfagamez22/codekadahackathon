import { PageHeader } from '@/components/layout/page-header'
import { StatsGrid } from '@/components/admin/stats-grid'
import { getSystemStats } from '@/lib/db/queries/analytics'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminPage() {
  const stats = await getSystemStats()

  return (
    <div>
      <PageHeader title="Admin Dashboard" description="System overview and management" />
      <StatsGrid stats={stats} />
    </div>
  )
}
