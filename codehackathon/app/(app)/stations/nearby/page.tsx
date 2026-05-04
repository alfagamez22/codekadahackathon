'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { StationCard } from '@/components/stations/station-card'
import { StationMap } from '@/components/stations/station-map'
import { StationListSkeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { useGeolocation } from '@/hooks/use-geolocation'
import type { StationListItem } from '@/types/station'

export default function NearbyPage() {
  const { coords, loading: geoLoading, error: geoError } = useGeolocation()
  const [view, setView] = useState<'list' | 'map'>('list')

  const { data, isLoading } = useQuery({
    queryKey: ['stations-nearby', coords?.lat, coords?.lng],
    queryFn: async () => {
      if (!coords) return { stations: [] }
      const res = await fetch(`/api/stations/nearby?lat=${coords.lat}&lng=${coords.lng}&radius=5`)
      return res.json() as Promise<{ stations: StationListItem[] }>
    },
    enabled: !!coords,
  })

  const stations = data?.stations ?? []

  return (
    <div>
      <PageHeader
        title="Nearby Stations"
        description="Gas stations within 5 km of your location"
      />

      {geoLoading && (
        <div className="text-center py-8 text-muted">
          <div className="text-3xl mb-2 animate-pulse">📍</div>
          <div>Getting your location...</div>
        </div>
      )}

      {geoError && (
        <div className="bg-fuel-red-light text-fuel-red rounded-lg p-4 mb-6 text-sm">
          Location access denied. Please enable location permissions and reload.
        </div>
      )}

      {coords && (
        <>
          <div className="flex gap-2 mb-4">
            <Button variant={view === 'list' ? 'primary' : 'ghost'} size="sm" onClick={() => setView('list')}>📋 List</Button>
            <Button variant={view === 'map' ? 'primary' : 'ghost'} size="sm" onClick={() => setView('map')}>🗺️ Map</Button>
          </div>

          {isLoading && <StationListSkeleton />}

          {!isLoading && view === 'map' && (
            <StationMap stations={stations} userLat={coords.lat} userLng={coords.lng} />
          )}

          {!isLoading && view === 'list' && (
            <>
              {stations.length === 0 ? (
                <div className="text-center py-12 text-muted">
                  <div className="text-4xl mb-3">🔍</div>
                  <div>No stations found within 5 km. Try a wider search.</div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {stations.map((s) => (
                    <StationCard key={s.id} station={s as never} distanceKm={s.distanceKm} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
