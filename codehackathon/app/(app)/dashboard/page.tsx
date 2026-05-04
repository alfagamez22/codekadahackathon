import { requireAuth } from '@/lib/auth/guards'
import { getSystemStats } from '@/lib/db/queries/analytics'
import { getTopContributors } from '@/lib/db/queries/analytics'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const session = await requireAuth()
  const [stats, contributors] = await Promise.all([
    getSystemStats(),
    getTopContributors(5),
  ])

  return (
    <div>
      <PageHeader
        title={`Hello, ${session.displayName?.split(' ')[0] ?? 'there'} 👋`}
        description="Track and report fuel prices across the Philippines."
        action={
          <Link href="/stations/nearby">
            <Button size="sm">📍 Find Nearby</Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Stations', value: stats.stationCount.toLocaleString(), icon: '⛽' },
          { label: 'Price Updates', value: stats.reportCount.toLocaleString(), icon: '📊' },
          { label: 'Community Members', value: stats.userCount.toLocaleString(), icon: '👥' },
          { label: 'Avg. Gasoline', value: stats.averagePrices.find((p) => p.fuelType === 'gasoline') ? `₱${stats.averagePrices.find((p) => p.fuelType === 'gasoline')!.avgPrice.toFixed(2)}` : '—', icon: '💰' },
        ].map((stat) => (
          <Card key={stat.label} className="text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-xl font-bold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Average prices */}
      {stats.averagePrices.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>National Average Prices</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {stats.averagePrices.map((p) => (
              <div key={p.fuelType} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-fuel-green">₱{p.avgPrice.toFixed(2)}</div>
                <div className="text-xs text-muted capitalize">{p.fuelType}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Link href="/stations/nearby">
          <Card className="hover:border-fuel-green cursor-pointer transition-colors">
            <div className="text-2xl mb-2">📍</div>
            <div className="font-semibold text-foreground">Nearby Stations</div>
            <div className="text-sm text-muted">Find stations close to you</div>
          </Card>
        </Link>
        <Link href="/validate">
          <Card className="hover:border-fuel-green cursor-pointer transition-colors">
            <div className="text-2xl mb-2">✅</div>
            <div className="font-semibold text-foreground">Validate Prices</div>
            <div className="text-sm text-muted">Help confirm community reports</div>
          </Card>
        </Link>
        <Link href={`/profile/${session.uid}`}>
          <Card className="hover:border-fuel-green cursor-pointer transition-colors">
            <div className="text-2xl mb-2">🏆</div>
            <div className="font-semibold text-foreground">My Contributions</div>
            <div className="text-sm text-muted">View your report history</div>
          </Card>
        </Link>
      </div>

      {/* Top contributors */}
      {contributors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
          </CardHeader>
          <div className="flex flex-col divide-y divide-border">
            {contributors.map((c, i) => (
              <div key={c.uid} className="flex items-center gap-3 py-3">
                <div className="w-6 text-sm text-muted text-center">{i + 1}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{c.displayName ?? 'Anonymous'}</div>
                  <div className="text-xs text-muted">{c.confirmedReportCount} confirmed reports</div>
                </div>
                <div className="text-sm text-fuel-green font-medium">+{c.trustScore} pts</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
