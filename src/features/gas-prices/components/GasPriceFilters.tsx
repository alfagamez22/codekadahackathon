'use client'

import { formatFuelType } from '../utils/formatFuelType'

export type SortOption = 'newest' | 'price-asc' | 'price-desc'

interface GasPriceFiltersProps {
  fuelTypes: string[]
  selectedFuelType: string
  sortOption: SortOption
  onFuelTypeChange: (value: string) => void
  onSortChange: (value: SortOption) => void
}

export function GasPriceFilters({
  fuelTypes,
  selectedFuelType,
  sortOption,
  onFuelTypeChange,
  onSortChange,
}: GasPriceFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Fuel type</label>
        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={selectedFuelType}
          onChange={(event) => onFuelTypeChange(event.target.value)}
        >
          <option value="all">All fuel types</option>
          {fuelTypes.map((fuelType) => (
            <option key={fuelType} value={fuelType}>
              {formatFuelType(fuelType)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Sort by</label>
        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={sortOption}
          onChange={(event) => onSortChange(event.target.value as SortOption)}
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>
    </div>
  )
}
