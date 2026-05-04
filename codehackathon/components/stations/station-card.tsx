import Link from 'next/link'
import { Card } from '@/components/ui/card'
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
      <Card className="hover:border-fuel-green cursor-pointer transition-colors group">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="font-semibold text-foreground group-hover:text-fuel-green transition-colors truncate">
              {station.name}
            </div>
            <div className="text-sm text-muted">
              {station.brand && <span className="font-medium">{station.brand} · </span>}
              {station.city}, {station.province}
            </div>
          </div>
          <div className="text-right shrink-0">
            {lowestPrice != null && (
              <div className="text-lg font-bold text-fuel-green">{formatPeso(lowestPrice)}</div>
            )}
            {distanceKm != null && (
              <div className="text-xs text-muted">{distanceKm.toFixed(1)} km</div>
            )}
          </div>
        </div>

        {prices.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {prices.map((p) => (
              <div key={p.fuelType} className="flex items-center gap-1.5">
                <Badge variant={getPriceBadge(p)} label={formatFuelType(p.fuelType)} />
                <span className="text-xs font-medium text-foreground">{formatPeso(p.currentPrice)}</span>
              </div>
            ))}
          </div>
        )}

        {prices.length === 0 && (
          <div className="text-xs text-muted italic">No prices reported yet</div>
        )}
      </Card>
    </Link>
  )
}
