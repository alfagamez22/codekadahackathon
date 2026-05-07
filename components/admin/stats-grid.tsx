import type { getSystemStats } from '@/lib/firebase-admin/queries/analytics'

type SystemStats = Awaited<ReturnType<typeof getSystemStats>>

interface StatsGridProps {
  stats: SystemStats
}

export function StatsGrid({ stats }: StatsGridProps) {
  const gasolineAvg = stats.averagePrices.find((p) => p.fuelType === 'gasoline')?.avgPrice
  const dieselAvg = stats.averagePrices.find((p) => p.fuelType === 'diesel')?.avgPrice

  const cards = [
    { label: 'Stations', detail: 'Tracked locations', value: stats.stationCount.toLocaleString(), tone: 'green' },
    { label: 'Users', detail: 'Registered accounts', value: stats.userCount.toLocaleString(), tone: 'blue' },
    { label: 'Reports', detail: 'Price submissions', value: stats.reportCount.toLocaleString(), tone: 'amber' },
    { label: 'Fuel Types', detail: 'With averages', value: stats.averagePrices.length.toLocaleString(), tone: 'slate' },
    { label: 'Gasoline Avg', detail: 'Current baseline', value: gasolineAvg ? `₱${gasolineAvg.toFixed(2)}` : '—', tone: 'green' },
    { label: 'Diesel Avg', detail: 'Current baseline', value: dieselAvg ? `₱${dieselAvg.toFixed(2)}` : '—', tone: 'blue' },
  ]

  const toneClasses: Record<string, string> = {
    green: 'bg-green-50 border-green-100',
    blue: 'bg-sky-50 border-sky-100',
    amber: 'bg-amber-50 border-amber-100',
    slate: 'bg-slate-50 border-slate-200',
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(({ label, detail, value, tone }) => (
        <div key={label} className={`rounded-xl border p-4 ${toneClasses[tone]}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-700">{label}</div>
              <div className="mt-0.5 text-xs text-slate-500">{detail}</div>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-slate-500/40" />
          </div>
          <div className="mt-4 text-2xl font-semibold text-slate-950 sm:text-3xl">{value}</div>
        </div>
      ))}
    </div>
  )
}

