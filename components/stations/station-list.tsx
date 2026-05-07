'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { StationCard } from './station-card'
import { StationFilters } from './station-filters'
import { StationMap } from './station-map'
import { StationListSkeleton } from '@/components/ui/skeleton'
import { useUserLocation } from '@/hooks/use-user-location'
import { cn } from '@/lib/utils'
import type { StationListItem } from '@/types/station'
import type { FuelType } from '@/types/station'

interface StationListProps {
  initialStations?: StationListItem[]
}

type Filters = { province?: string; brand?: string; fuelType?: FuelType; search?: string }

export function StationList({ initialStations = [] }: StationListProps) {
  const [filters, setFilters] = useState<Filters>({})
  const [view, setView] = useState<'list' | 'map'>('list')
  const { location } = useUserLocation()

  const { data, isLoading } = useQuery({
    queryKey: ['stations', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.province) params.set('province', filters.province)
      if (filters.brand) params.set('brand', filters.brand)
      if (filters.fuelType) params.set('fuelType', filters.fuelType)
      if (filters.search) params.set('search', filters.search)
      const res = await fetch(`/api/stations?${params}`)
      return res.json() as Promise<{ stations: StationListItem[]; total: number }>
    },
    initialData: { stations: initialStations, total: initialStations.length },
    staleTime: 30000,
  })

  const handleFilterChange = useCallback((f: Filters) => setFilters(f), [])
  const stations = data?.stations ?? []

  return (
    <div>
      <StationFilters onFilterChange={handleFilterChange} />

      <div className="flex items-center gap-1 mb-4 p-1 rounded-lg border border-border bg-muted w-fit">
        {(['list', 'map'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              view === v
                ? 'bg-white text-[#0a0a0a] shadow-sm dark:bg-[#1f2937] dark:text-[#f9fafb]'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <i className={v === 'list' ? 'ri-list-check text-base' : 'ri-map-2-line text-base'} />
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {isLoading && <StationListSkeleton />}

      {!isLoading && view === 'map' && (
        <StationMap
          stations={stations}
          userLat={location?.lat}
          userLng={location?.lng}
          showUserMarker
        />
      )}

      {!isLoading && view === 'list' && (
        <>
          {stations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-border bg-card">
              <i className="ri-search-line text-4xl text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No stations found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your filters or search area.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {stations.map((station) => (
                <StationCard key={station.id} station={station as never} distanceKm={station.distanceKm} />
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center mt-4">
            Showing {stations.length} of {data?.total ?? 0} stations
          </p>
        </>
      )}
    </div>
  )
}
