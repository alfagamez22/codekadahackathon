'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatPeso } from '@/lib/utils/format'
import type { PriceHistory } from '@/types/price'

interface PriceHistoryChartProps {
  history: PriceHistory[]
}

export function PriceHistoryChart({ history }: PriceHistoryChartProps) {
  const data = history
    .slice()
    .reverse()
    .map((entry) => ({
      date: new Date(entry.changedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
      price: Number(entry.newPrice),
      fuelType: entry.fuelType,
    }))

  if (data.length === 0) {
    return <div className="text-center py-8 text-muted text-sm">No data to display</div>
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => `₱${v}`}
          domain={['auto', 'auto']}
        />
        <Tooltip formatter={(v) => (typeof v === 'number' ? formatPeso(v) : v)} />
        <Line type="monotone" dataKey="price" stroke="#16a34a" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
