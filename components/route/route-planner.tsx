'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useRouteCalculation } from '@/hooks/use-route-calculation'
import { useUserLocation } from '@/hooks/use-user-location'
import { RouteMap } from './route-map'
import type { RouteInfo, RoutePoint } from '@/types/route'

type GaswatchPriceMap = Record<string, number | null>

type GaswatchStation = {
  id: number
  brand: string | null
  name: string
  area?: string
  lat: number
  lng: number
  prices: GaswatchPriceMap
}

export type NearbyStation = {
  id: string
  name: string
  brand: string | null
  area?: string
  lat: number
  lng: number
  prices: GaswatchPriceMap
}

const GASWATCH_RADIUS_KM = 5
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
  const values = Object.values(prices).filter((v): v is number => typeof v === 'number')
  return values.length > 0 ? Math.min(...values) : null
}

const getPriceEntries = (prices: GaswatchPriceMap) => {
  const entries = Object.entries(prices)
    .filter(([, v]) => typeof v === 'number')
    .map(([fuelType, value]) => ({ fuelType, price: value as number }))
  entries.sort((a, b) => {
    const ai = PRICE_ORDER.indexOf(a.fuelType)
    const bi = PRICE_ORDER.indexOf(b.fuelType)
    if (ai === -1 && bi === -1) return a.fuelType.localeCompare(b.fuelType)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
  return entries
}

type RouteCoordinates = Array<[number, number]> | Array<Array<[number, number]>>

// Flatten GeoJSON LineString or MultiLineString coordinates into [lat, lng] objects
function flattenRouteCoords(coords: RouteCoordinates): Array<{ lat: number; lng: number }> {
  if (!Array.isArray(coords) || coords.length === 0) return []
  const first = coords[0]
  const flat: Array<[number, number]> = []
  if (Array.isArray(first) && typeof first[0] === 'number') {
    flat.push(...(coords as Array<[number, number]>))
  } else if (Array.isArray(first) && Array.isArray(first[0])) {
    for (const line of coords as Array<Array<[number, number]>>) {
      for (const pair of line) flat.push(pair)
    }
  }
  // GeoJSON is [lng, lat]
  return flat.map((p) => ({ lat: p[1], lng: p[0] }))
}

// Walk the polyline and return the point at exactly half the total route distance
function getRouteMidpoint(
  coords: RouteCoordinates,
  fallbackA: { lat: number; lng: number },
  fallbackB: { lat: number; lng: number }
): { lat: number; lng: number } {
  const points = flattenRouteCoords(coords)
  if (points.length < 2) {
    // Straight-line midpoint as fallback
    return { lat: (fallbackA.lat + fallbackB.lat) / 2, lng: (fallbackA.lng + fallbackB.lng) / 2 }
  }

  // Calculate total polyline length
  let totalLength = 0
  for (let i = 1; i < points.length; i++) {
    totalLength += getDistanceKm(points[i - 1], points[i])
  }

  // Walk until we reach the half-distance mark
  const half = totalLength / 2
  let accumulated = 0
  for (let i = 1; i < points.length; i++) {
    const segLen = getDistanceKm(points[i - 1], points[i])
    if (accumulated + segLen >= half) {
      // Interpolate within this segment
      const t = segLen === 0 ? 0 : (half - accumulated) / segLen
      return {
        lat: points[i - 1].lat + t * (points[i].lat - points[i - 1].lat),
        lng: points[i - 1].lng + t * (points[i].lng - points[i - 1].lng),
      }
    }
    accumulated += segLen
  }

  return points[points.length - 1]
}

const formatFuel = (fuelType: string) => {
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

export function RoutePlanner() {
  const [startAddress, setStartAddress] = useState('')
  const [endAddress, setEndAddress] = useState('')
  const [route, setRoute] = useState<RouteInfo | null>(null)
  const [calculatingRoute, setCalculatingRoute] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [destSuggestions, setDestSuggestions] = useState<RoutePoint[]>([])
  const [showDestSuggestions, setShowDestSuggestions] = useState(false)
  const destRef = useRef<HTMLDivElement>(null)

  const [startSuggestions, setStartSuggestions] = useState<RoutePoint[]>([])
  const [showStartSuggestions, setShowStartSuggestions] = useState(false)
  const startRef = useRef<HTMLDivElement>(null)

  const { geocodeAddress, fetchAutocompleteSuggestions, calculateRoute, loading: geocodingLoading, error } = useRouteCalculation()
  const { location: userLocation } = useUserLocation()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setShowDestSuggestions(false)
      }
      if (startRef.current && !startRef.current.contains(event.target as Node)) {
        setShowStartSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (endAddress.trim() && showDestSuggestions) {
        const suggestions = await fetchAutocompleteSuggestions(endAddress)
        setDestSuggestions(suggestions.slice(0, 5))
      } else {
        setDestSuggestions([])
      }
    }, 400)
    return () => clearTimeout(timeout)
  }, [endAddress, fetchAutocompleteSuggestions, showDestSuggestions])

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (startAddress.trim() && showStartSuggestions && startAddress !== 'current') {
        const suggestions = await fetchAutocompleteSuggestions(startAddress)
        setStartSuggestions(suggestions.slice(0, 5))
      } else {
        setStartSuggestions([])
      }
    }, 400)
    return () => clearTimeout(timeout)
  }, [startAddress, fetchAutocompleteSuggestions, showStartSuggestions])

  const { data: gaswatchData } = useQuery({
    queryKey: ['gaswatch-stations'],
    queryFn: async () => {
      const res = await fetch('/api/gaswatchph/stations')
      if (!res.ok) throw new Error('Failed to load GasWatchPH stations.')
      return res.json() as Promise<{ stations: GaswatchStation[] }>
    },
    refetchOnWindowFocus: false,
  })

  const gaswatchStations = useMemo(() => gaswatchData?.stations ?? [], [gaswatchData])

  const nearbyStations = useMemo<NearbyStation[]>(() => {
    if (!route || gaswatchStations.length === 0) return []

    const pointA = route.startPoint
    const pointB = route.endPoint
    const pointC = getRouteMidpoint(route.coordinates, pointA, pointB)

    const seen = new Set<number>()
    const candidates: (NearbyStation & { closestDistanceKm: number })[] = []

    for (const station of gaswatchStations) {
      const coord = { lat: station.lat, lng: station.lng }
      const dA = getDistanceKm(pointA, coord)
      const dB = getDistanceKm(pointB, coord)
      const dC = getDistanceKm(pointC, coord)
      const minDist = Math.min(dA, dB, dC)

      if (minDist <= GASWATCH_RADIUS_KM && !seen.has(station.id)) {
        seen.add(station.id)
        candidates.push({
          id: String(station.id),
          name: station.name,
          brand: station.brand,
          area: station.area,
          lat: station.lat,
          lng: station.lng,
          prices: station.prices,
          closestDistanceKm: minDist,
        })
      }
    }

    // Take the 10 nearest to any of the three points, then sort by cheapest price
    candidates.sort((a, b) => a.closestDistanceKm - b.closestDistanceKm)
    const top10 = candidates.slice(0, 10)
    top10.sort((a, b) => {
      const pa = getLowestPrice(a.prices) ?? Infinity
      const pb = getLowestPrice(b.prices) ?? Infinity
      return pa - pb
    })
    return top10.map(({ closestDistanceKm: _, ...rest }) => rest)
  }, [route, gaswatchStations])

  async function handleCalculateRoute(e: React.FormEvent) {
    e.preventDefault()

    setCalculatingRoute(true)
    setFormError(null)
    try {
      const useCurrentAsStart = startAddress === 'current'
      let startPoint: RoutePoint | null = null

      if (useCurrentAsStart && userLocation) {
        startPoint = {
          lat: userLocation.lat,
          lng: userLocation.lng,
          address: 'Your current location',
        }
      } else if (startAddress) {
        startPoint = await geocodeAddress(startAddress)
      }

      if (!startPoint) {
        setFormError('Please enter or select a valid starting point.')
        return
      }

      const endPoint = await geocodeAddress(endAddress)
      if (!endPoint) {
        setFormError('Please enter a valid destination.')
        return
      }

      const calculatedRoute = await calculateRoute(startPoint, endPoint)
      if (calculatedRoute) {
        setRoute(calculatedRoute)
      }
    } finally {
      setCalculatingRoute(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <h2 className="text-lg font-semibold mb-4">Plan Your Route</h2>

        <form onSubmit={handleCalculateRoute} className="space-y-4">
          <div className="space-y-2 relative" ref={startRef}>
            <label className="text-sm font-medium">Starting Point</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter address or search..."
                value={startAddress}
                onChange={(e) => {
                  setStartAddress(e.target.value)
                  setShowStartSuggestions(true)
                }}
                onFocus={() => setShowStartSuggestions(true)}
              />
              {userLocation && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setStartAddress('current')
                    setShowStartSuggestions(false)
                  }}
                  className="whitespace-nowrap"
                >
                  📍 Use Current
                </Button>
              )}
            </div>
            {showStartSuggestions && startSuggestions.length > 0 && startAddress !== 'current' && (
              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg">
                {startSuggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    className="p-2 text-sm cursor-pointer hover:bg-muted"
                    onClick={() => {
                      setStartAddress(suggestion.address)
                      setShowStartSuggestions(false)
                    }}
                  >
                    {suggestion.address}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 relative" ref={destRef}>
            <label className="text-sm font-medium">Destination</label>
            <Input
              placeholder="Enter destination address..."
              value={endAddress}
              onChange={(e) => {
                setEndAddress(e.target.value)
                setShowDestSuggestions(true)
              }}
              onFocus={() => setShowDestSuggestions(true)}
            />
            {showDestSuggestions && destSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg">
                {destSuggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    className="p-2 text-sm cursor-pointer hover:bg-muted"
                    onClick={() => {
                      setEndAddress(suggestion.address)
                      setShowDestSuggestions(false)
                    }}
                  >
                    {suggestion.address}
                  </div>
                ))}
              </div>
            )}
          </div>

          {(formError || error) && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{formError ?? error}</div>}

          <Button
            type="submit"
            loading={geocodingLoading || calculatingRoute}
            className="w-full"
          >
            Calculate Route
          </Button>
        </form>
      </Card>

      {route && (
        <>
          <Card padding="lg">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted">From</p>
                <p className="font-medium">{route.startPoint.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted">To</p>
                <p className="font-medium">{route.endPoint.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <p className="text-sm text-muted">Distance</p>
                  <p className="text-2xl font-bold text-fuel-green">{route.distance.toFixed(1)} km</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Estimated travel time</p>
                  <p className="text-2xl font-bold text-fuel-green">{route.duration} min</p>
                </div>
              </div>
            </div>
          </Card>

          <RouteMap route={route} loading={calculatingRoute} nearbyStations={nearbyStations} />

          {nearbyStations.length > 0 && (
            <Card padding="lg">
              <h3 className="text-base font-semibold mb-1">Nearby Gas Stations</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Stations within {GASWATCH_RADIUS_KM} km of your origin or destination, sorted by cheapest price.
              </p>
              <div className="grid gap-3">
                {nearbyStations.map((station) => {
                  const entries = getPriceEntries(station.prices)
                  const lowestPrice = getLowestPrice(station.prices)
                  return (
                    <div key={station.id} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-foreground">{station.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {station.brand ?? 'Independent'}{station.area ? ` · ${station.area}` : ''}
                          </div>
                        </div>
                        {lowestPrice !== null && (
                          <div className="text-xs font-semibold text-fuel-green whitespace-nowrap">
                            from PHP {lowestPrice.toFixed(2)}
                          </div>
                        )}
                      </div>
                      {entries.length > 0 ? (
                        <div className="mt-2 grid gap-1 text-xs">
                          {entries.map((entry) => (
                            <div key={entry.fuelType} className="flex items-center justify-between">
                              <span className="text-muted-foreground">{formatFuel(entry.fuelType)}</span>
                              <span className="font-medium text-foreground">PHP {entry.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-muted">No prices reported yet.</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {route && gaswatchStations.length > 0 && nearbyStations.length === 0 && (
            <Card padding="lg">
              <p className="text-sm text-muted-foreground">
                No gas stations found within {GASWATCH_RADIUS_KM} km of your origin or destination.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
