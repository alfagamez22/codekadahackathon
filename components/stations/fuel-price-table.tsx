import { Badge } from '@/components/ui/badge'
import { formatPeso, formatRelativeTime, formatFuelType } from '@/lib/utils/format'
import type { FuelPrice } from '@/types/price'

const STALE_DAYS = 7

function getPriceBadge(price: FuelPrice) {
  const isStale = Date.now() - new Date(price.updatedAt).getTime() > STALE_DAYS * 86400 * 1000
  if (isStale) return 'stale' as const
  if (price.sourceType === 'admin') return 'admin-verified' as const
  if (price.sourceType === 'community') return 'community-verified' as const
  return 'baseline' as const
}

interface FuelPriceTableProps {
  prices: FuelPrice[]
}

export function FuelPriceTable({ prices }: FuelPriceTableProps) {
  if (prices.length === 0) {
    return (
      <div className="text-sm text-muted py-4 text-center italic">
        No prices reported yet. Be the first to submit one!
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 font-medium text-muted">Fuel Type</th>
            <th className="text-right py-2 font-medium text-muted">Price</th>
            <th className="text-right py-2 font-medium text-muted hidden sm:table-cell">Source</th>
            <th className="text-right py-2 font-medium text-muted hidden md:table-cell">Updated</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((price) => (
            <tr key={price.fuelType} className="border-b border-border last:border-0">
              <td className="py-3 font-medium text-foreground">{formatFuelType(price.fuelType)}</td>
              <td className="py-3 text-right font-bold text-fuel-green">{formatPeso(price.currentPrice)}</td>
              <td className="py-3 text-right hidden sm:table-cell">
                <Badge variant={getPriceBadge(price)} />
              </td>
              <td className="py-3 text-right text-muted hidden md:table-cell">
                {formatRelativeTime(price.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
