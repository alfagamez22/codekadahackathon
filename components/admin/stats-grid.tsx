import type { getSystemStats } from '@/lib/firebase-admin/queries/analytics'

type SystemStats = Awaited<ReturnType<typeof getSystemStats>>

interface StatsGridProps {
  stats: SystemStats
}

export function StatsGrid({ stats }: StatsGridProps) {
  const gasolineAvg = stats.averagePrices.find((p) => p.fuelType === 'gasoline')?.avgPrice
  const dieselAvg = stats.averagePrices.find((p) => p.fuelType === 'diesel')?.avgPrice

  const cards = [
    { label: 'Stations', value: stats.stationCount.toLocaleString(), tone: 'teal' },
    { label: 'Users', value: stats.userCount.toLocaleString(), tone: 'sky' },
    { label: 'Reports', value: stats.reportCount.toLocaleString(), tone: 'amber' },
    { label: 'Fuel Types Tracked', value: stats.averagePrices.length.toLocaleString(), tone: 'slate' },
    { label: 'Avg Gasoline', value: gasolineAvg ? `₱${gasolineAvg.toFixed(2)}` : '—', tone: 'teal' },
    { label: 'Avg Diesel', value: dieselAvg ? `₱${dieselAvg.toFixed(2)}` : '—', tone: 'sky' },
  ]

  const toneClasses: Record<string, string> = {
    teal: 'bg-teal-50 border-teal-100',
    sky: 'bg-sky-50 border-sky-100',
    amber: 'bg-amber-50 border-amber-100',
    slate: 'bg-slate-50 border-slate-200',
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {cards.map(({ label, value, tone }) => (
        <div key={label} className={`border rounded-2xl p-4 ${toneClasses[tone]}`}>
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-slate-700">{label}</div>
            <span className="h-2.5 w-2.5 rounded-full bg-slate-500/40" />
          </div>
          <div className="mt-3 text-3xl font-semibold text-slate-950">{value}</div>
        </div>
      ))}
    </div>
  )
}

