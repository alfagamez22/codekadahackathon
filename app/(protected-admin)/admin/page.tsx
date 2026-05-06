import { PageHeader } from '@/components/layout/page-header'
import { StatsGrid } from '@/components/admin/stats-grid'
import { getSystemStats } from '@/lib/firebase-admin/queries/analytics'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminPage() {
  const stats = await getSystemStats()
  const hottest = [...stats.averagePrices]
    .sort((a, b) => b.avgPrice - a.avgPrice)
    .slice(0, 3)

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" description="Operational snapshot and system health." />

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Network Coverage</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{stats.stationCount.toLocaleString()}</p>
            <p className="text-sm text-muted">Active stations onboarded</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Community Reach</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{stats.userCount.toLocaleString()}</p>
            <p className="text-sm text-muted">Registered contributors</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Report Volume</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{stats.reportCount.toLocaleString()}</p>
            <p className="text-sm text-muted">Total price reports processed</p>
          </div>
        </div>
      </div>

      <StatsGrid stats={stats} />

      <Card>
        <CardHeader>
          <CardTitle>Highest Average Fuel Prices</CardTitle>
        </CardHeader>
        {hottest.length === 0 ? (
          <p className="text-sm text-muted">No fuel price averages available yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {hottest.map((item) => (
              <div key={item.fuelType} className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs uppercase tracking-wide text-muted">{item.fuelType}</p>
                <p className="mt-1 text-xl font-semibold text-foreground">₱{item.avgPrice.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
