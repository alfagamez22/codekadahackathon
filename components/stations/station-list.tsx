'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { StationCard } from './station-card'
import { StationFilters } from './station-filters'
import { StationMap } from './station-map'
import { StationListSkeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useUserLocation } from '@/hooks/use-user-location'
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

      <div className="flex gap-2 mb-4">
        <Button variant={view === 'list' ? 'primary' : 'ghost'} size="sm" onClick={() => setView('list')}>
          📋 List
        </Button>
        <Button variant={view === 'map' ? 'primary' : 'ghost'} size="sm" onClick={() => setView('map')}>
          🗺️ Map
        </Button>
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
            <div className="text-center py-12 text-muted">
              <div className="text-4xl mb-3">🔍</div>
              <div>No stations found. Try adjusting your filters.</div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {stations.map((station) => (
                <StationCard key={station.id} station={station as never} distanceKm={station.distanceKm} />
              ))}
            </div>
          )}
          <div className="text-xs text-muted text-center mt-4">
            Showing {stations.length} of {data?.total ?? 0} stations
          </div>
        </>
      )}
    </div>
  )
}
