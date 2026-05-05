'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { StationCard } from '@/components/stations/station-card'
import { StationMap } from '@/components/stations/station-map'
import { StationListSkeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { useGeolocation } from '@/hooks/use-geolocation'
import { GasPricesPage } from '@/src/features/gas-prices'
import { useOsmStations } from '@/src/features/osm-stations'
import type { StationListItem } from '@/types/station'

export default function NearbyPage() {
  const { coords, loading: geoLoading, error: geoError, requestLocation, statusMessage, permission } = useGeolocation({ auto: false })
  const [view, setView] = useState<'list' | 'map'>('list')
  const { stations: ncrStations, loading: osmLoading, error: osmError, refetch: refetchOsm } = useOsmStations()

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
  const ncrMapStations = useMemo<StationListItem[]>(() => {
    return ncrStations.map((station) => ({
      id: station.id,
      name: station.name,
      brand: station.brand ?? station.operator,
      city: station.city,
      province: station.province,
      latitude: station.latitude,
      longitude: station.longitude,
      lowestPrice: null,
      lowestFuelType: null,
    }))
  }, [ncrStations])

  return (
    <div>
      <PageHeader
        title="Nearby Stations"
        description="Gas stations within 5 km of your location"
      />

      {geoLoading && (
        <div className="text-center py-8 text-muted">
          <div className="text-3xl mb-2 animate-pulse">📍</div>
          <div>{statusMessage ?? 'Requesting your location...'}</div>
        </div>
      )}

      {!geoLoading && !coords && !geoError && (
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="text-sm mb-3 text-muted-foreground">
            Enable location to find stations near you.
          </div>
          <Button variant="primary" size="sm" onClick={requestLocation}>
            Use my location
          </Button>
        </div>
      )}

      {geoError && (
        <div className="bg-fuel-red-light text-fuel-red rounded-lg p-4 mb-6">
          <div className="text-sm mb-2">
            {geoError}
            {permission === 'denied' && (
              <div className="mt-2 text-xs text-fuel-red/90">
                Open your browser’s site settings (lock icon in the address bar) and allow Location for this site.
              </div>
            )}
          </div>
          {permission === 'denied' && (
            <div className="text-xs text-fuel-red/80 mb-3">
              To enable it manually, open your browser site settings (lock icon near the address bar),
              allow Location for this site, then refresh the page.
            </div>
          )}
          {permission !== 'denied' && (
            <Button
              variant="primary"
              size="sm"
              onClick={requestLocation}
              className="bg-fuel-red hover:bg-fuel-red/90"
            >
              Use my location
            </Button>
          )}
        </div>
      )}

      {!geoLoading && !coords && !geoError && statusMessage && (
        <div className="text-sm text-muted-foreground mb-4">
          {statusMessage}
        </div>
      )}

      {coords && (
        <>
          <div className="text-xs text-muted-foreground mb-4">
            Location: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </div>
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

      <div className="mt-10">
        <GasPricesPage />
      </div>

      <section className="mt-12 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">NCR Gas Stations (OpenStreetMap)</h2>
          <p className="text-sm text-muted-foreground">
            Station locations sourced from OpenStreetMap within Metro Manila.
          </p>
        </div>

        {osmLoading && (
          <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Loading NCR station locations...
          </div>
        )}

        {osmError && !osmLoading && (
          <div className="rounded-lg border border-fuel-red bg-fuel-red-light p-6 text-sm text-fuel-red">
            <div className="mb-3">{osmError}</div>
            <Button variant="primary" size="sm" onClick={refetchOsm}>
              Retry
            </Button>
          </div>
        )}

        {!osmLoading && !osmError && (
          <>
            <StationMap
              stations={ncrMapStations}
              userLat={coords?.lat}
              userLng={coords?.lng}
            />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {ncrStations.slice(0, 60).map((station) => (
                <div key={station.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="font-medium">{station.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {station.brand ?? station.operator ?? 'Independent'} · {station.city}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
