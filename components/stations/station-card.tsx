import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatPeso, formatRelativeTime, formatFuelType } from '@/lib/utils/format'
import type { Station } from '@/types/station'
import type { FuelPrice } from '@/types/price'

interface StationCardProps {
  station: Station & { prices?: FuelPrice[] }
  distanceKm?: number
}

const STALE_DAYS = 7

function getPriceBadge(price: FuelPrice) {
  const isStale = Date.now() - new Date(price.updatedAt).getTime() > STALE_DAYS * 86400 * 1000
  if (isStale) return 'stale' as const
  if (price.sourceType === 'admin') return 'admin-verified' as const
  if (price.sourceType === 'community') return 'community-verified' as const
  return 'baseline' as const
}

export function StationCard({ station, distanceKm }: StationCardProps) {
  const prices = station.prices ?? []
  const lowestPrice = prices.length > 0 ? Math.min(...prices.map((p) => p.currentPrice)) : null

  return (
    <Link href={`/stations/${station.id}`}>
      <div className="rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {station.brand ?? 'Station'}
          </span>
          {distanceKm != null && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <i className="ri-map-pin-2-line" />
              {distanceKm.toFixed(1)} km
            </span>
          )}
        </div>

        <div className="px-4 py-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">{station.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {station.city}, {station.province}
            </div>
          </div>
          {lowestPrice != null && (
            <div className="text-2xl font-semibold tabular-nums text-[#16a34a] shrink-0">
              {formatPeso(lowestPrice)}
            </div>
          )}
        </div>

        {prices.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pb-3">
            {prices.map((p) => (
              <div key={p.fuelType} className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{formatFuelType(p.fuelType)}</span>
                <span className="text-xs font-semibold tabular-nums text-foreground">{formatPeso(p.currentPrice)}</span>
                <Badge variant={getPriceBadge(p)} />
              </div>
            ))}
          </div>
        )}

        {prices.length === 0 && (
          <div className="px-4 pb-3 text-xs text-muted-foreground">No prices reported yet</div>
        )}
      </div>
    </Link>
  )
}
