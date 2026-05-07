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
      <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No prices reported yet. Be the first to submit one!
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Fuel Type</th>
            <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground">Price</th>
            <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Source</th>
            <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Updated</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((price) => (
            <tr key={price.fuelType} className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
              <td className="py-3 px-4 font-medium text-foreground">{formatFuelType(price.fuelType)}</td>
              <td className="py-3 px-4 text-right">
                <span className="text-xl font-semibold tabular-nums text-[#16a34a]">
                  {formatPeso(price.currentPrice)}
                </span>
              </td>
              <td className="py-3 px-4 text-right hidden sm:table-cell">
                <Badge variant={getPriceBadge(price)} />
              </td>
              <td className="py-3 px-4 text-right text-xs text-muted-foreground hidden md:table-cell">
                {formatRelativeTime(price.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
