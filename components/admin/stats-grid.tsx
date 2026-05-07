import type { getSystemStats } from '@/lib/firebase-admin/queries/analytics'

type SystemStats = Awaited<ReturnType<typeof getSystemStats>>

interface StatsGridProps {
  stats: SystemStats
}

const cardIcons: Record<string, string> = {
  Stations: 'ri-gas-station-line',
  Users: 'ri-group-line',
  Reports: 'ri-bar-chart-box-line',
  'Fuel Types': 'ri-database-2-line',
  'Gasoline Avg': 'ri-money-peso-circle-line',
  'Diesel Avg': 'ri-oil-line',
}

export function StatsGrid({ stats }: StatsGridProps) {
  const gasolineAvg = stats.averagePrices.find((p) => p.fuelType === 'gasoline')?.avgPrice
  const dieselAvg = stats.averagePrices.find((p) => p.fuelType === 'diesel')?.avgPrice

  const cards = [
    { label: 'Stations', detail: 'Tracked locations', value: stats.stationCount.toLocaleString() },
    { label: 'Users', detail: 'Registered accounts', value: stats.userCount.toLocaleString() },
    { label: 'Reports', detail: 'Price submissions', value: stats.reportCount.toLocaleString() },
    { label: 'Fuel Types', detail: 'With averages', value: stats.averagePrices.length.toLocaleString() },
    { label: 'Gasoline Avg', detail: 'Current baseline', value: gasolineAvg ? `₱${gasolineAvg.toFixed(2)}` : '—' },
    { label: 'Diesel Avg', detail: 'Current baseline', value: dieselAvg ? `₱${dieselAvg.toFixed(2)}` : '—' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
      {cards.map(({ label, detail, value }) => (
        <div key={label} className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs font-medium text-muted-foreground">{label}</div>
              <div className="text-xs text-muted-foreground/60 mt-0.5">{detail}</div>
            </div>
            <i className={`${cardIcons[label] ?? 'ri-bar-chart-line'} text-xl text-muted-foreground`} />
          </div>
          <div className="text-2xl font-semibold tabular-nums text-foreground">{value}</div>
        </div>
      ))}
    </div>
  )
}
