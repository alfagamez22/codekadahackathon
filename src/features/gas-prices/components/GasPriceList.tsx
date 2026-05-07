'use client'

import { GasPriceCard } from './GasPriceCard'
import type { GasPriceItem } from '../types/gasPrice.types'

interface GasPriceListProps {
  items: GasPriceItem[]
}

export function GasPriceList({ items }: GasPriceListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No community price reports found yet.
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <GasPriceCard key={`${item.stationId}-${item.fuelType}`} item={item} />
      ))}
    </div>
  )
}
