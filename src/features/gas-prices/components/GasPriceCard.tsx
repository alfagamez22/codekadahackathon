'use client'

import { formatFuelType } from '../utils/formatFuelType'
import type { GasPriceItem } from '../types/gasPrice.types'

interface GasPriceCardProps {
  item: GasPriceItem
}

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2,
})

export function GasPriceCard({ item }: GasPriceCardProps) {
  const formattedFuel = formatFuelType(item.fuelType)
  const formattedDate = item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Unknown time'

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm text-muted-foreground">Station</div>
          <div className="font-semibold">{item.stationId}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Fuel Type</div>
          <div className="font-semibold">{formattedFuel}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-2xl font-semibold text-fuel-green">
          {currencyFormatter.format(item.price)}
        </div>
        <div className="text-xs text-muted-foreground">
          {item.reportCount} report{item.reportCount === 1 ? '' : 's'}
        </div>
      </div>

      {item.note && (
        <div className="mt-3 text-sm text-muted-foreground">{item.note}</div>
      )}

      <div className="mt-3 text-xs text-muted-foreground">Updated {formattedDate}</div>
    </div>
  )
}
