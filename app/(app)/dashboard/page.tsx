import { requireAuth } from '@/lib/auth/guards'
import { getSystemStats, getTopContributors } from '@/lib/firebase-admin/queries/analytics'
import { listUsers } from '@/lib/firebase-admin/queries/users'
import { searchStations } from '@/lib/firebase-admin/queries/stations'
import { listStationSubmissions } from '@/lib/firebase-admin/queries/station-submissions'
import { getSystemConfig } from '@/lib/firebase-admin/firestore'
import {
  fetchGaswatchScript,
  parseGaswatchStations,
  parsePriceHistory,
  findCurrentWeekPrices,
  getPhilippineDateString,
  type GaswatchStation,
  type GaswatchPriceWeek,
} from '@/lib/gaswatchph'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { UserManagementTable } from '@/components/admin/user-management-table'
import { StationEditor } from '@/components/admin/station-editor'
import { SystemConfigForm } from '@/components/admin/system-config-form'
import { PriceAutoRefresher } from '@/components/dashboard/price-auto-refresher'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
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

function isDashboardPanel(value: string | undefined): value is DashboardPanel {
  return value === 'overview' || value === 'users' || value === 'stations' || value === 'config'
}

function isAdminSession(session: SessionUser) {
  return session.role === 'admin' || session.role === 'superadmin'
}

function formatCurrency(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? `₱${value.toFixed(2)}` : '—'
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

  const [stats, contributors, gaswatchSnapshot, usersData, stationsData, stationSubmissions, config] = await Promise.all([
    getSystemStats(),
    getTopContributors(5),
    activePanel === 'overview' ? getGaswatchSnapshot() : Promise.resolve(null),
    isAdmin && activePanel === 'users' ? listUsers({}) : Promise.resolve(null),
    isAdmin && activePanel === 'stations' ? searchStations({}) : Promise.resolve(null),
    isAdmin && activePanel === 'stations' ? listStationSubmissions({ status: 'pending', limit: 50 }) : Promise.resolve([]),
    isAdmin && activePanel === 'config' ? getSystemConfig() : Promise.resolve(null),
  ])

  const gaswatchStations = gaswatchSnapshot?.stations ?? null
  const priceWeek = gaswatchSnapshot?.priceWeek ?? null

  const gasolineAvg = stats.averagePrices.find((p) => p.fuelType === 'gasoline')?.avgPrice
  const dashboardStats = [
    { label: 'Stations', value: stats.stationCount.toLocaleString(), icon: 'ri-gas-station-line' },
    { label: 'Price Updates', value: stats.reportCount.toLocaleString(), icon: 'ri-bar-chart-line' },
    { label: 'Community Members', value: stats.userCount.toLocaleString(), icon: 'ri-group-line' },
    { label: 'Avg. Gasoline', value: formatCurrency(gasolineAvg), icon: 'ri-money-peso-circle-line' },
  ]

  return (
    <div className="space-y-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-0.5">
            {new Intl.DateTimeFormat('en-PH', {
              timeZone: 'Asia/Manila',
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            }).format(new Date())}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Hello, {session.displayName?.split(' ')[0] ?? 'there'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? 'Track fuel prices and manage system data from one dashboard.'
              : 'Track and report fuel prices across the Philippines.'}
          </p>
        </div>
        <Link
          href="/stations/nearby"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted shrink-0"
        >
          <i className="ri-map-pin-2-line text-base" />
          Find Nearby
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </span>
              <i className={`${stat.icon} text-base text-muted-foreground`} />
            </div>
            <div className="text-3xl font-semibold tabular-nums text-foreground">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Admin tabs ── */}
      {isAdmin && <DashboardTabs activePanel={activePanel} />}

      {isAdmin && activePanel !== 'overview' ? (
        <AdminPanelContent
          activePanel={activePanel}
          users={usersData?.users ?? []}
          stations={stationsData?.stations ?? []}
          stationSubmissions={stationSubmissions}
          config={config}
        />
      ) : (
        <DashboardOverview
          contributors={contributors}
          gaswatchStations={gaswatchStations}
          priceWeek={priceWeek}
          session={session}
          isAdmin={isAdmin}
          phTimestamp={phTimestamp}
        />
      )}
    </div>
  )
}

async function getGaswatchSnapshot() {
  try {
    const source = await fetchGaswatchScript()
    const stations = parseGaswatchStations(source)
    const history = parsePriceHistory(source)
    const todayPh = getPhilippineDateString()
    const priceWeek = findCurrentWeekPrices(history, todayPh)
    return { stations, priceWeek }
  } catch (error) {
    console.error('[dashboard] GasWatchPH snapshot failed:', error)
    return null
  }
}

function DashboardTabs({ activePanel }: { activePanel: DashboardPanel }) {
  return (
    <div className="border-b border-border">
      <nav className="-mb-px flex gap-0">
        {adminPanels.map((panel) => (
          <Link
            key={panel.id}
            href={`/dashboard?panel=${panel.id}`}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activePanel === panel.id
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
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
  contributors,
  gaswatchStations,
  priceWeek,
  session,
  isAdmin,
  phTimestamp,
}: {
  contributors: Awaited<ReturnType<typeof getTopContributors>>
  gaswatchStations: GaswatchStation[] | null
  priceWeek: GaswatchPriceWeek | null
  session: SessionUser
  isAdmin: boolean
  phTimestamp: string
}) {
  return (
    <div className="space-y-6">
      <PriceAutoRefresher />
      <NationalAveragePrices priceWeek={priceWeek} phTimestamp={phTimestamp} />
      <GaswatchSourcePanel stations={gaswatchStations} isAdmin={isAdmin} />

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <DashboardAction
          href="/stations/nearby"
          icon="ri-map-pin-2-line"
          title="Nearby Stations"
          description="Find stations close to you"
        />
        <DashboardAction
          href="/validate"
          icon="ri-checkbox-circle-line"
          title="Validate Prices"
          description="Help confirm community reports"
        />
        <DashboardAction
          href={`/profile/${session.uid}`}
          icon="ri-trophy-line"
          title="My Contributions"
          description="View your report history"
        />
      </div>

      {/* Top contributors */}
      {contributors.length > 0 && (
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Top Contributors</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Most confirmed price reports</p>
          </div>
          <div className="divide-y divide-border">
            {contributors.map((c, i) => (
              <div key={c.uid || `contributor-${i}`} className="flex items-center gap-3 px-5 py-3">
                <span className="w-5 text-sm font-medium tabular-nums text-muted-foreground">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{c.displayName ?? 'Anonymous'}</div>
                  <div className="text-xs text-muted-foreground">{c.confirmedReportCount} confirmed reports</div>
                </div>
                <span className="inline-flex items-center rounded-md bg-[#f0fdf4] dark:bg-[#052e16] px-2 py-0.5 text-xs font-medium text-[#16a34a] ring-1 ring-inset ring-[#bbf7d0] dark:ring-[#14532d]">
                  +{c.trustScore} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const BRAND_LABELS: Record<string, string> = {
  shell: 'Shell',
  petron: 'Petron',
  caltex: 'Caltex',
  phoenix: 'Phoenix',
  seaoil: 'Seaoil',
  unioil: 'Unioil',
  jetti: 'Jetti',
  flyingv: 'Flying V',
  cleanfuel: 'Cleanfuel',
  total: 'TotalEnergies',
  ptt: 'PTT',
}

function NationalAveragePrices({ priceWeek, phTimestamp }: { priceWeek: GaswatchPriceWeek | null; phTimestamp: string }) {
  if (!priceWeek) {
    return (
      <Card>
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>National Average Prices</CardTitle>
            <p className="mt-0.5 text-xs text-muted">{phTimestamp}</p>
          </div>
        </CardHeader>
        <div className="rounded-lg border border-border bg-gray-50 p-4 text-sm text-muted">
          No national average prices are available yet.
        </div>
      </Card>
    )
  }

  const brandEntries = Object.entries(priceWeek.brands)

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <CardTitle>National Average Prices</CardTitle>
          <p className="mt-0.5 text-xs text-muted">Week of {priceWeek.label} · {phTimestamp}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
          Live
        </span>
      </div>

      {/* Diesel / Gasoline averages */}
      <div className="grid grid-cols-2 divide-x divide-border">
        <div className="px-5 py-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Diesel</p>
          <p className="text-3xl font-semibold tabular-nums text-foreground">
            {formatCurrency(priceWeek.dieselAvg)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">National average</p>
        </div>
        <div className="px-5 py-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Gasoline</p>
          <p className="text-3xl font-semibold tabular-nums text-[#16a34a]">
            {formatCurrency(priceWeek.unleadedAvg)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">National average</p>
        </div>
      </div>

      {/* Per-brand breakdown */}
      {brandEntries.length > 0 && (
        <>
          <div className="px-5 pb-2 pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">By Brand</p>
          </div>
          <div className="px-5 pb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {brandEntries.map(([brand, prices]) => (
              <div key={brand} className="rounded-md bg-muted border border-border p-3">
                <p className="text-xs font-semibold text-foreground mb-2 truncate">
                  {BRAND_LABELS[brand] ?? brand.charAt(0).toUpperCase() + brand.slice(1)}
                </p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Diesel</span>
                    <span className="text-xs font-semibold tabular-nums text-foreground">{formatCurrency(prices.diesel)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Gas</span>
                    <span className="text-xs font-semibold tabular-nums text-[#16a34a]">{formatCurrency(prices.unleaded)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function DashboardAction({
  href,
  icon,
  title,
  description,
}: {
  href: string
  icon: string
  title: string
  description: string
}) {
  return (
    <Link href={href}>
      <div className="group rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="rounded-md bg-muted p-2">
            <i className={`${icon} text-base text-muted-foreground`} />
          </div>
          <i className="ri-arrow-right-line text-sm text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </Link>
  )
}

function GaswatchSourcePanel({
  stations,
  isAdmin,
}: {
  stations: GaswatchStation[] | null
  isAdmin: boolean
}) {
  const stationCount = stations?.length ?? 0
  const pricedStations =
    stations?.filter((s) => Object.values(s.prices).some((p) => typeof p === 'number')).length ?? 0
  const brandCount = stations ? new Set(stations.map((s) => s.brand).filter(Boolean)).size : 0

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Live Price Feed</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f0fdf4] dark:bg-[#052e16] px-2 py-0.5 text-xs font-medium text-[#16a34a] ring-1 ring-inset ring-[#bbf7d0] dark:ring-[#14532d]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
              Live
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAdmin
              ? 'Live imported data. Admin actions write through Firebase.'
              : 'Imported station feed. Compare with nearby stations for live pump prices.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border">
        {[
          { label: 'Stations', value: stationCount },
          { label: 'With Prices', value: pricedStations },
          { label: 'Brands', value: brandCount },
        ].map(({ label, value }) => (
          <div key={label} className="px-5 py-4 text-center">
            <p className="text-2xl font-semibold tabular-nums text-foreground">{value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {stations === null && (
        <div className="px-5 py-3 border-t border-[#fef3c7] dark:border-[#78350f] bg-[#fffbeb] dark:bg-[#1c1408]">
          <p className="text-xs text-[#92400e] dark:text-[#fbbf24]">
            <i className="ri-alert-line mr-1" />
            Gastos data temporarily unavailable. Firebase data remains available.
          </p>
        </div>
      )}
    </div>
  )
}

function AdminPanelContent({
  activePanel,
  users,
  stations,
  stationSubmissions,
  config,
}: {
  activePanel: Exclude<DashboardPanel, 'overview'>
  users: Awaited<ReturnType<typeof listUsers>>['users']
  stations: Awaited<ReturnType<typeof searchStations>>['stations']
  stationSubmissions: Awaited<ReturnType<typeof listStationSubmissions>>
  config: Awaited<ReturnType<typeof getSystemConfig>> | null
}) {
  const wrapperClass = 'rounded-lg border border-border bg-card shadow-sm overflow-hidden'
  const headerClass = 'px-5 py-4 border-b border-border'
  const titleClass = 'text-sm font-semibold text-foreground'
  const bodyClass = 'p-5'

  if (activePanel === 'users') {
    return (
      <div className={wrapperClass}>
        <div className={headerClass}>
          <h3 className={titleClass}>User Management</h3>
        </div>
        <div className={bodyClass}>
          <UserManagementTable users={users} />
        </div>
      </div>
    )
  }

  if (activePanel === 'stations') {
    return (
      <Card padding="lg">
        <CardHeader>
          <CardTitle>Station Management</CardTitle>
        </CardHeader>
        <StationEditor stations={stations} stationSubmissions={stationSubmissions} />
      </Card>
    )
  }

  return (
    <div className={wrapperClass}>
      <div className={headerClass}>
        <h3 className={titleClass}>System Config</h3>
      </div>
      <div className={bodyClass}>
        {config ? (
          <SystemConfigForm config={config} />
        ) : (
          <p className="text-sm text-muted-foreground">System config is unavailable.</p>
        )}
      </div>
    </div>
  )
}
