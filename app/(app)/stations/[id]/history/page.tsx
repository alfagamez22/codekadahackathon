import { requireAuth } from '@/lib/auth/guards'
import { getStation } from '@/lib/firebase-admin/queries/stations'
import { getPriceHistory } from '@/lib/firebase-admin/queries/prices'
import { PageHeader } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { formatPeso, formatDate, formatFuelType } from '@/lib/utils/format'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Price History' }

export default async function PriceHistoryPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  await requireAuth()

  const [station, history] = await Promise.all([
    getStation(id),
    getPriceHistory({ stationId: id, limit: 50 }),
  ])

  if (!station) notFound()

  return (
    <div>
      <PageHeader
        title="Price History"
        description={`${station.name} · ${station.city}`}
      />

      <Card>
        {history.length === 0 ? (
          <div className="text-center py-12 text-muted text-sm">No price history available yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted">Date</th>
                  <th className="text-left py-2 font-medium text-muted">Fuel Type</th>
                  <th className="text-right py-2 font-medium text-muted">Old Price</th>
                  <th className="text-right py-2 font-medium text-muted">New Price</th>
                  <th className="text-right py-2 font-medium text-muted">Source</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id} className="border-b border-border last:border-0">
                    <td className="py-3 text-muted">{formatDate(entry.changedAt)}</td>
                    <td className="py-3 font-medium">{formatFuelType(entry.fuelType)}</td>
                    <td className="py-3 text-right text-muted">
                      {entry.oldPrice != null ? formatPeso(entry.oldPrice) : '—'}
                    </td>
                    <td className="py-3 text-right font-bold text-fuel-green">
                      {formatPeso(entry.newPrice)}
                    </td>
                    <td className="py-3 text-right capitalize text-xs text-muted">{entry.sourceType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
