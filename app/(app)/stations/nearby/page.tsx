'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { StationMap } from '@/components/stations/station-map'
import { StationListSkeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { useGeolocation } from '@/hooks/use-geolocation'
import type { GaswatchPriceMap, GaswatchStation } from '@/lib/gaswatchph'
import type { StationListItem } from '@/types/station'

type GaswatchStationWithDistance = GaswatchStation & { distanceKm?: number }

const GASWATCH_RADIUS_KM = 5
const DEFAULT_CITY = 'Metro Manila'
const DEFAULT_PROVINCE = 'NCR'
const PRICE_ORDER = ['diesel', 'premiumDiesel', 'unleaded', 'egasoline', 'premium95', 'premium97', 'kerosene']

const toRadians = (value: number) => (value * Math.PI) / 180

const getDistanceKm = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
  const earthRadiusKm = 6371
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)

  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const a = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusKm * c
}

const getLowestPrice = (prices: GaswatchPriceMap) => {
  const values = Object.values(prices).filter((value): value is number => typeof value === 'number')
  return values.length > 0 ? Math.min(...values) : null
}

const formatGaswatchFuel = (fuelType: string) => {
  const labels: Record<string, string> = {
    diesel: 'Diesel',
    premiumDiesel: 'Premium Diesel',
    unleaded: 'Unleaded 91',
    egasoline: 'E-Gasoline',
    premium95: 'Premium 95',
    premium97: 'Premium 97',
    kerosene: 'Kerosene',
  }

  return labels[fuelType] ?? fuelType
}

const getPriceEntries = (prices: GaswatchPriceMap) => {
  const entries = Object.entries(prices)
    .filter(([, value]) => typeof value === 'number')
    .map(([fuelType, value]) => ({ fuelType, price: value as number }))

  entries.sort((a, b) => {
    const aIndex = PRICE_ORDER.indexOf(a.fuelType)
    const bIndex = PRICE_ORDER.indexOf(b.fuelType)
    if (aIndex === -1 && bIndex === -1) return a.fuelType.localeCompare(b.fuelType)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  return entries
}

export default function NearbyPage() {
  const { coords, loading: geoLoading, error: geoError, requestLocation, statusMessage, permission } = useGeolocation({ auto: false })
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null)

  const {
    data: gaswatchData,
    isLoading: gaswatchLoading,
    error: gaswatchError,
    refetch: refetchGaswatch,
  } = useQuery({
    queryKey: ['gaswatch-stations'],
    queryFn: async () => {
      const res = await fetch('/api/gaswatchph/stations')
      if (!res.ok) {
        throw new Error('Failed to load GasWatchPH stations.')
      }
      return res.json() as Promise<{ stations: GaswatchStation[] }>
    },
  })

  const gaswatchStations = useMemo(() => gaswatchData?.stations ?? [], [gaswatchData?.stations])

  const stationsWithDistance = useMemo<GaswatchStationWithDistance[]>(() => {
    if (!coords) return gaswatchStations

    return gaswatchStations.map((station) => ({
      ...station,
      distanceKm: getDistanceKm(coords, { lat: station.lat, lng: station.lng }),
    }))
  }, [coords, gaswatchStations])

  const displayedStations = useMemo(() => {
    if (!coords) {
      return [...stationsWithDistance].sort((a, b) => a.name.localeCompare(b.name))
    }

    return stationsWithDistance
      .filter((station) => (station.distanceKm ?? 0) <= GASWATCH_RADIUS_KM)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
  }, [coords, stationsWithDistance])

  const mapStations = useMemo<(StationListItem & { prices?: GaswatchPriceMap })[]>(() => {
    return displayedStations.map((station) => ({
      id: `gaswatch-${station.id}`,
      name: station.name,
      brand: station.brand ?? null,
      city: station.area ?? DEFAULT_CITY,
      province: DEFAULT_PROVINCE,
      latitude: station.lat,
      longitude: station.lng,
      lowestPrice: getLowestPrice(station.prices),
      lowestFuelType: null,
      distanceKm: station.distanceKm,
      prices: station.prices,
    }))
  }, [displayedStations])

  const selectedStation = useMemo(() => {
    if (!selectedStationId) return null
    return mapStations.find((station) => station.id === selectedStationId) ?? null
  }, [mapStations, selectedStationId])

  return (
    <div>
      <PageHeader
        title="Nearby Stations"
        description="Live pump prices and stations near your location."
      />

      {geoLoading && (
        <div className="text-center py-8 text-muted">
          <div className="text-3xl mb-2 animate-pulse">📍</div>
          <div>{statusMessage ?? 'Requesting your location...'}</div>
        </div>
      )}

      {!geoLoading && !coords && !geoError && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="mb-3 text-sm text-muted">
            Enable location to filter stations within {GASWATCH_RADIUS_KM} km. You can still browse all stations without sharing your location.
          </div>
          <Button variant="primary" size="sm" onClick={requestLocation}>
            Use my location
          </Button>
        </div>
      )}

      {geoError && (
        <div className="mb-6 rounded-lg bg-fuel-red-light p-4 text-sm text-fuel-red">
          <div className="mb-2">{geoError}</div>
          {permission === 'denied' ? (
            <div className="text-xs text-fuel-red/90">
              Open your browser site settings, allow Location for this site, then refresh the page.
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={requestLocation}
              className="bg-fuel-red hover:bg-fuel-red/90"
            >
              Try location again
            </Button>
          )}
        </div>
      )}

      {coords ? (
        <div className="mb-4 text-xs text-muted">
          Location: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </div>
      ) : (
        <div className="mb-4 text-xs text-muted">
          Showing all stations. Enable location to filter within {GASWATCH_RADIUS_KM} km.
        </div>
      )}

      {gaswatchLoading && <StationListSkeleton />}

      {gaswatchError && !gaswatchLoading && (
        <div className="rounded-lg border border-fuel-red bg-fuel-red-light p-4 text-sm text-fuel-red">
          <div className="mb-3">
            {gaswatchError instanceof Error ? gaswatchError.message : 'Unable to load GasWatchPH data.'}
          </div>
          <Button variant="primary" size="sm" onClick={() => refetchGaswatch()}>
            Retry
          </Button>
        </div>
      )}

      {!gaswatchLoading && !gaswatchError && (
        <>
          <div className="mb-6">
            <div className="relative">
              <StationMap
                stations={mapStations}
                userLat={coords?.lat}
                userLng={coords?.lng}
                onStationSelect={setSelectedStationId}
                showMarkerPopup={false}
                containerClassName="-mx-4 rounded-none border-x-0 sm:mx-0 sm:rounded-xl sm:border-x"
                mapClassName="h-80 sm:h-[520px] lg:h-[620px]"
              />
              {selectedStation && (
                <div className="absolute left-1/2 top-4 z-10 w-[90%] max-w-md -translate-x-1/2 rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-foreground">{selectedStation.name}</div>
                      <div className="text-xs text-muted">
                        {(selectedStation.brand ?? 'Independent')} - {selectedStation.city}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedStationId(null)}>
                      Close
                    </Button>
                  </div>
                  <PriceList prices={selectedStation.prices ?? {}} />
                </div>
              )}
            </div>
          </div>

          {displayedStations.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <div className="text-4xl mb-3">🔍</div>
              <div>{coords ? 'No stations found within 5 km. Try a wider search.' : 'No stations found yet. Try again later.'}</div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {displayedStations.map((station) => (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => setSelectedStationId(`gaswatch-${station.id}`)}
                  className="rounded-lg border border-border bg-card p-3 text-left transition hover:border-fuel-green hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-foreground">{station.name}</div>
                      <div className="text-xs text-muted">
                        {(station.brand ?? 'Independent')} - {station.area ?? DEFAULT_CITY}
                      </div>
                    </div>
                    {station.distanceKm != null && (
                      <div className="text-xs text-muted">
                        {station.distanceKm.toFixed(1)} km
                      </div>
                    )}
                  </div>
                  <PriceList prices={station.prices} />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PriceList({ prices }: { prices: GaswatchPriceMap }) {
  const entries = getPriceEntries(prices)

  if (entries.length === 0) {
    return <div className="mt-2 text-xs text-muted">No prices reported yet.</div>
  }

  return (
    <div className="mt-3 grid gap-1 text-xs">
      {entries.map((entry) => (
        <div key={entry.fuelType} className="flex items-center justify-between">
          <span className="text-muted">{formatGaswatchFuel(entry.fuelType)}</span>
          <span className="font-medium text-foreground">PHP {entry.price.toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}
