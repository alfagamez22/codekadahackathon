import { requireAuth } from '@/lib/auth/guards'
import { getSystemStats, getTopContributors } from '@/lib/firebase-admin/queries/analytics'
import { listUsers } from '@/lib/firebase-admin/queries/users'
import { searchStations } from '@/lib/firebase-admin/queries/stations'
import { getSystemConfig } from '@/lib/firebase-admin/firestore'
import { fetchGaswatchScript, parseGaswatchStations, type GaswatchStation } from '@/lib/gaswatchph'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { UserManagementTable } from '@/components/admin/user-management-table'
import { StationEditor } from '@/components/admin/station-editor'
import { SystemConfigForm } from '@/components/admin/system-config-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'
import type { SessionUser } from '@/types/auth'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Dashboard' }

type DashboardPanel = 'overview' | 'users' | 'stations' | 'config'
type DashboardSearchParams = Promise<{ panel?: string | string[] | undefined }>

const adminPanels: Array<{ id: DashboardPanel; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'stations', label: 'Stations' },
  { id: 'config', label: 'Config' },
]

const fuelTypeLabels: Record<string, string> = {
  diesel: 'Diesel',
  gasoline: 'Regular Gasoline',
  unleaded: 'Regular Gasoline',
  premium: 'Premium Gasoline',
  premium95: 'Premium Gasoline',
  premium97: 'Premium Gasoline',
  premiumDiesel: 'Premium Diesel',
  kerosene: 'Kerosene',
  lpg: 'LPG',
}

const fuelTypeOrder = ['diesel', 'gasoline', 'unleaded', 'premium', 'premium95', 'premium97', 'premiumDiesel', 'kerosene', 'lpg']

function isDashboardPanel(value: string | undefined): value is DashboardPanel {
  return value === 'overview' || value === 'users' || value === 'stations' || value === 'config'
}

function isAdminSession(session: SessionUser) {
  return session.role === 'admin' || session.role === 'superadmin'
}

function formatCurrency(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? `₱${value.toFixed(2)}` : '—'
}

function formatFuelType(fuelType: string) {
  return fuelTypeLabels[fuelType] ?? fuelType
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
}

function sortAveragePrices(prices: Array<{ fuelType: string; avgPrice: number }>) {
  return [...prices].sort((a, b) => {
    const aIndex = fuelTypeOrder.indexOf(a.fuelType)
    const bIndex = fuelTypeOrder.indexOf(b.fuelType)
    if (aIndex === -1 && bIndex === -1) return a.fuelType.localeCompare(b.fuelType)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })
}

function getPhilippineTimestamp() {
  return `${new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date())} PHT`
}

export default async function DashboardPage({ searchParams }: { searchParams: DashboardSearchParams }) {
  const session = await requireAuth()
  const query = await searchParams
  const requestedPanel = Array.isArray(query.panel) ? query.panel[0] : query.panel
  const isAdmin = isAdminSession(session)
  const activePanel: DashboardPanel = isAdmin && isDashboardPanel(requestedPanel) ? requestedPanel : 'overview'
  const phTimestamp = getPhilippineTimestamp()

  const [stats, contributors, gaswatchStations, usersData, stationsData, config] = await Promise.all([
    getSystemStats(),
    getTopContributors(5),
    activePanel === 'overview' ? getGaswatchStationsSnapshot() : Promise.resolve(null),
    isAdmin && activePanel === 'users' ? listUsers({}) : Promise.resolve(null),
    isAdmin && activePanel === 'stations' ? searchStations({}) : Promise.resolve(null),
    isAdmin && activePanel === 'config' ? getSystemConfig() : Promise.resolve(null),
  ])

  const gasolineAvg = stats.averagePrices.find((p) => p.fuelType === 'gasoline')?.avgPrice
  const dashboardStats = [
    { label: 'Stations', value: stats.stationCount.toLocaleString(), icon: '⛽' },
    { label: 'Price Updates', value: stats.reportCount.toLocaleString(), icon: '📊' },
    { label: 'Community Members', value: stats.userCount.toLocaleString(), icon: '👥' },
    { label: 'Avg. Gasoline', value: formatCurrency(gasolineAvg), icon: '💰' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${session.displayName?.split(' ')[0] ?? 'there'} 👋`}
        description={
          isAdmin
            ? 'Track fuel prices and manage system data from one dashboard.'
            : 'Track and report fuel prices across the Philippines.'
        }
        action={
          <Link href="/stations/nearby">
            <Button size="sm">📍 Find Nearby</Button>
          </Link>
        }
      />

      {isAdmin && <DashboardTabs activePanel={activePanel} />}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.label} className="text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-xl font-bold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted">{stat.label}</div>
          </Card>
        ))}
      </div>

      {isAdmin && activePanel !== 'overview' ? (
        <AdminPanelContent
          activePanel={activePanel}
          users={usersData?.users ?? []}
          stations={stationsData?.stations ?? []}
          config={config}
        />
      ) : (
        <DashboardOverview
          stats={stats}
          contributors={contributors}
          gaswatchStations={gaswatchStations}
          session={session}
          isAdmin={isAdmin}
          phTimestamp={phTimestamp}
        />
      )}
    </div>
  )
}

async function getGaswatchStationsSnapshot() {
  try {
    return parseGaswatchStations(await fetchGaswatchScript())
  } catch (error) {
    console.error('[dashboard] GasWatchPH snapshot failed:', error)
    return null
  }
}

function DashboardTabs({ activePanel }: { activePanel: DashboardPanel }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card p-2">
      <nav className="flex min-w-max gap-1">
        {adminPanels.map((panel) => (
          <Link
            key={panel.id}
            href={`/dashboard?panel=${panel.id}`}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activePanel === panel.id
                ? 'bg-fuel-green text-white shadow-sm'
                : 'text-foreground hover:bg-muted/20'
            }`}
          >
            {panel.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}

function DashboardOverview({
  stats,
  contributors,
  gaswatchStations,
  session,
  isAdmin,
  phTimestamp,
}: {
  stats: Awaited<ReturnType<typeof getSystemStats>>
  contributors: Awaited<ReturnType<typeof getTopContributors>>
  gaswatchStations: GaswatchStation[] | null
  session: SessionUser
  isAdmin: boolean
  phTimestamp: string
}) {
  return (
    <>
      <NationalAveragePrices prices={stats.averagePrices} phTimestamp={phTimestamp} />

      <GaswatchSourcePanel stations={gaswatchStations} isAdmin={isAdmin} />

      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardAction href="/stations/nearby" icon="📍" title="Nearby Stations" description="Find stations close to you" />
        <DashboardAction href="/validate" icon="✅" title="Validate Prices" description="Help confirm community reports" />
        <DashboardAction href={`/profile/${session.uid}`} icon="🏆" title="My Contributions" description="View your report history" />
      </div>

      {contributors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
          </CardHeader>
          <div className="flex flex-col divide-y divide-border">
            {contributors.map((c, i) => (
              <div key={c.uid || `contributor-${i}`} className="flex items-center gap-3 py-3">
                <div className="w-6 text-center text-sm text-muted">{i + 1}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{c.displayName ?? 'Anonymous'}</div>
                  <div className="text-xs text-muted">{c.confirmedReportCount} confirmed reports</div>
                </div>
                <div className="text-sm font-medium text-fuel-green">+{c.trustScore} pts</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}

function NationalAveragePrices({
  prices,
  phTimestamp,
}: {
  prices: Array<{ fuelType: string; avgPrice: number }>
  phTimestamp: string
}) {
  const sortedPrices = sortAveragePrices(prices)

  return (
    <Card>
      <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <CardTitle>National Average Prices</CardTitle>
        <p className="text-xs text-muted">As of {phTimestamp}</p>
      </CardHeader>
      {sortedPrices.length === 0 ? (
        <div className="rounded-lg border border-border bg-gray-50 p-4 text-sm text-muted">
          No national average prices are available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {sortedPrices.map((p) => (
            <div key={p.fuelType} className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="text-lg font-bold text-fuel-green">{formatCurrency(p.avgPrice)}</div>
              <div className="text-xs text-muted">{formatFuelType(p.fuelType)}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function DashboardAction({ href, icon, title, description }: { href: string; icon: string; title: string; description: string }) {
  return (
    <Link href={href}>
      <Card className="cursor-pointer transition-colors hover:border-fuel-green">
        <div className="mb-2 text-2xl">{icon}</div>
        <div className="font-semibold text-foreground">{title}</div>
        <div className="text-sm text-muted">{description}</div>
      </Card>
    </Link>
  )
}

function GaswatchSourcePanel({ stations, isAdmin }: { stations: GaswatchStation[] | null; isAdmin: boolean }) {
  const stationCount = stations?.length ?? 0
  const pricedStations =
    stations?.filter((station) => Object.values(station.prices).some((price) => typeof price === 'number')).length ?? 0
  const brandCount = stations ? new Set(stations.map((station) => station.brand).filter(Boolean)).size : 0

  return (
    <Card className="bg-slate-950 text-white" padding="lg">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-green-200">Live Station Source</p>
          <h3 className="mt-1 text-xl font-semibold">GasWatchPH station feed</h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            {isAdmin
              ? 'Live imported data is visible here while admin actions continue to write through Firebase.'
              : 'Browse the imported station feed, then use nearby stations to compare live pump prices.'}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
          <SourceMetric label="Stations" value={stationCount} />
          <SourceMetric label="With prices" value={pricedStations} />
          <SourceMetric label="Brands" value={brandCount} />
        </div>
      </div>
      {stations === null && (
        <div className="mt-4 rounded-lg border border-amber-300/40 bg-amber-300/10 p-3 text-sm text-amber-100">
          GasWatchPH data is temporarily unavailable. Firebase-backed dashboard data remains available.
        </div>
      )}
    </Card>
  )
}

function SourceMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white/10 p-3">
      <div className="text-2xl font-semibold">{value.toLocaleString()}</div>
      <div className="text-xs text-slate-300">{label}</div>
    </div>
  )
}

function AdminPanelContent({
  activePanel,
  users,
  stations,
  config,
}: {
  activePanel: Exclude<DashboardPanel, 'overview'>
  users: Awaited<ReturnType<typeof listUsers>>['users']
  stations: Awaited<ReturnType<typeof searchStations>>['stations']
  config: Awaited<ReturnType<typeof getSystemConfig>> | null
}) {
  if (activePanel === 'users') {
    return (
      <Card padding="lg">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <UserManagementTable users={users} />
      </Card>
    )
  }

  if (activePanel === 'stations') {
    return (
      <Card padding="lg">
        <CardHeader>
          <CardTitle>Station Management</CardTitle>
        </CardHeader>
        <StationEditor stations={stations} />
      </Card>
    )
  }

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>System Config</CardTitle>
      </CardHeader>
      {config ? <SystemConfigForm config={config} /> : <p className="text-sm text-muted">System config is unavailable.</p>}
    </Card>
  )
}
