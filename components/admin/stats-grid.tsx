import type { getSystemStats } from '@/lib/db/queries/analytics'

type SystemStats = Awaited<ReturnType<typeof getSystemStats>>

interface StatsGridProps {
  stats: SystemStats
}

export function StatsGrid({ stats }: StatsGridProps) {
  const gasolineAvg = stats.averagePrices.find((p) => p.fuelType === 'gasoline')?.avgPrice
  const dieselAvg = stats.averagePrices.find((p) => p.fuelType === 'diesel')?.avgPrice

  const cards = [
    { label: 'Total Stations', value: stats.stationCount.toLocaleString() },
    { label: 'Total Users', value: stats.userCount.toLocaleString() },
    { label: 'Total Reports', value: stats.reportCount.toLocaleString() },
    { label: 'Price Entries', value: stats.averagePrices.length.toLocaleString() },
    { label: 'Avg Gasoline Price', value: gasolineAvg ? `₱${gasolineAvg.toFixed(2)}` : '—' },
    { label: 'Avg Diesel Price', value: dieselAvg ? `₱${dieselAvg.toFixed(2)}` : '—' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {cards.map(({ label, value }) => (
        <div key={label} className="bg-background border border-border rounded-xl p-4">
          <div className="text-sm text-muted mb-1">{label}</div>
          <div className="text-2xl font-bold text-foreground">{value}</div>
        </div>
      ))}
    </div>
  )
}

