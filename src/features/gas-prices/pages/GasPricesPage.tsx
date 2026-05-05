'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useGasPrices } from '../hooks/useGasPrices'
import { GasPriceFilters, type SortOption } from '../components/GasPriceFilters'
import { GasPriceList } from '../components/GasPriceList'

export function GasPricesPage() {
  const { gasPrices, loading, error, refetch } = useGasPrices()
  const [selectedFuelType, setSelectedFuelType] = useState('all')
  const [sortOption, setSortOption] = useState<SortOption>('newest')

  const fuelTypes = useMemo(() => {
    return Array.from(new Set(gasPrices.map((price) => price.fuelType))).sort()
  }, [gasPrices])

  const filteredPrices = useMemo(() => {
    const items = selectedFuelType === 'all'
      ? gasPrices
      : gasPrices.filter((price) => price.fuelType === selectedFuelType)

    if (sortOption === 'price-asc') {
      return [...items].sort((a, b) => a.price - b.price)
    }

    if (sortOption === 'price-desc') {
      return [...items].sort((a, b) => b.price - a.price)
    }

    return items
  }, [gasPrices, selectedFuelType, sortOption])

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Community Gas Prices</h2>
        <p className="text-sm text-muted-foreground">
          Latest crowd-sourced price updates from stations across the community.
        </p>
      </div>

      {loading && (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Loading community prices...
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-fuel-red bg-fuel-red-light p-6 text-sm text-fuel-red">
          <div className="mb-3">{error}</div>
          <Button variant="primary" size="sm" onClick={refetch}>
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && (
        <>
          <GasPriceFilters
            fuelTypes={fuelTypes}
            selectedFuelType={selectedFuelType}
            sortOption={sortOption}
            onFuelTypeChange={setSelectedFuelType}
            onSortChange={setSortOption}
          />
          <GasPriceList items={filteredPrices} />
        </>
      )}
    </section>
  )
}
