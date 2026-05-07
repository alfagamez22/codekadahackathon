'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { submitExternalPriceReportAction } from '@/app/_actions/reports'
import { useRouteCalculation } from '@/hooks/use-route-calculation'
import { useUserLocation } from '@/hooks/use-user-location'
import { RouteMap } from './route-map'
import type { RouteInfo, RoutePoint } from '@/types/route'
import type { FuelType } from '@/types/station'
import {
  APP_FUEL_LABELS,
  APP_FUEL_TYPES,
  DEFAULT_FILL_VOLUME,
  DEFAULT_FUEL_PROFILE_ID,
  DEFAULT_TRAFFIC_MODE,
  FUEL_ECONOMY_PROFILES,
  GASWATCH_RADIUS_KM,
  TRAFFIC_MODE_LABELS,
  classifyFuelEconomy,
  createStationDecision,
  formatFuel,
  getFuelEconomyMidpoint,
  getFuelEconomyProfile,
  getFuelEconomyRange,
  getLowestPrice,
  getNearbyStations,
  getPhilippinesAdjustedDuration,
  getPriceEntries,
  isStationAlongRoute,
  type GaswatchPriceMap,
  type NearbyStation,
  type StationDecision,
  type TrafficMode,
} from '@/lib/route-planner-utils'

type GaswatchStation = {
  id: number
  brand: string | null
  name: string
  area?: string
  lat: number
  lng: number
  prices: GaswatchPriceMap
}

type CommunityOverride = {
  stationId: string
  fuelType: FuelType
  price: number
}

const formatCurrency = (value: number) => `PHP ${value.toFixed(2)}`

const formatDistance = (value: number) => `${value.toFixed(value >= 10 ? 0 : 1)} km`

const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining > 0 ? `${hours} hr ${remaining} min` : `${hours} hr`
}

const suggestionKey = (point: RoutePoint) => `${point.lat}:${point.lng}:${point.address}`

const uniqueSuggestions = (points: RoutePoint[]) => {
  const seen = new Set<string>()
  return points.filter((point) => {
    const key = suggestionKey(point)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function RoutePlanner() {
  const [startAddress, setStartAddress] = useState('')
  const [endAddress, setEndAddress] = useState('')
  const [resolvedStartPoint, setResolvedStartPoint] = useState<RoutePoint | null>(null)
  const [route, setRoute] = useState<RouteInfo | null>(null)
  const [calculatingRoute, setCalculatingRoute] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [destSuggestions, setDestSuggestions] = useState<RoutePoint[]>([])
  const [showDestSuggestions, setShowDestSuggestions] = useState(false)
  const destRef = useRef<HTMLDivElement>(null)

  const [startSuggestions, setStartSuggestions] = useState<RoutePoint[]>([])
  const [showStartSuggestions, setShowStartSuggestions] = useState(false)
  const startRef = useRef<HTMLDivElement>(null)

  const [selectedStationId, setSelectedStationId] = useState<string | null>(null)
  const [selectedStation, setSelectedStation] = useState<StationDecision | null>(null)
  const [alternateRoute, setAlternateRoute] = useState<RouteInfo | null>(null)
  const [calculatingAlternate, setCalculatingAlternate] = useState(false)

  const [recommendedDestinations, setRecommendedDestinations] = useState<RoutePoint[]>([])
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)
  const recommendationsOffsetRef = useRef(0)
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null)
  const [recommendationVisibleCount, setRecommendationVisibleCount] = useState(4)
  const [hasMoreRecommendations, setHasMoreRecommendations] = useState(true)

  const [fuelProfileId, setFuelProfileId] = useState(DEFAULT_FUEL_PROFILE_ID)
  const [trafficMode, setTrafficMode] = useState<TrafficMode>(DEFAULT_TRAFFIC_MODE)
  const [fillVolumeLiters, setFillVolumeLiters] = useState(DEFAULT_FILL_VOLUME)
  const [targetFuelType, setTargetFuelType] = useState<FuelType>('diesel')

  const [priceCalloutStationId, setPriceCalloutStationId] = useState<string | null>(null)
  const [calloutFuelType, setCalloutFuelType] = useState<FuelType>('diesel')
  const [calloutPrice, setCalloutPrice] = useState('')
  const [calloutPending, setCalloutPending] = useState(false)
  const [calloutMessage, setCalloutMessage] = useState<string | null>(null)

  const {
    geocodeAddress,
    fetchAutocompleteSuggestions,
    fetchRecommendedDestinations,
    calculateRoute,
    calculateRouteWithWaypoints,
    loading: geocodingLoading,
    error,
  } = useRouteCalculation()
  const { location: userLocation } = useUserLocation()

  const { data: gaswatchData } = useQuery({
    queryKey: ['gaswatch-stations'],
    queryFn: async () => {
      const res = await fetch('/api/gaswatchph/stations')
      if (!res.ok) throw new Error('Failed to load GasWatchPH stations.')
      return res.json() as Promise<{ stations: GaswatchStation[] }>
    },
    refetchOnWindowFocus: false,
  })

  const { data: communityOverrideData } = useQuery({
    queryKey: ['community-price-overrides'],
    queryFn: async () => {
      const res = await fetch('/api/community-overrides')
      if (!res.ok) throw new Error('Failed to load community price overrides.')
      return res.json() as Promise<{ prices: CommunityOverride[] }>
    },
    refetchOnWindowFocus: false,
  })

  const communityOverridesByStation = useMemo(() => {
    const map = new Map<string, CommunityOverride[]>()
    for (const price of communityOverrideData?.prices ?? []) {
      const current = map.get(price.stationId) ?? []
      current.push(price)
      map.set(price.stationId, current)
    }
    return map
  }, [communityOverrideData])

  const gaswatchStations = useMemo(() => {
    return (gaswatchData?.stations ?? []).map((station) => {
      const overrides = communityOverridesByStation.get(`gaswatch-${station.id}`) ?? []
      if (overrides.length === 0) return station
      const prices = { ...station.prices }
      for (const override of overrides) {
        prices[override.fuelType] = override.price
      }
      return { ...station, prices }
    })
  }, [communityOverridesByStation, gaswatchData])
  const fuelProfile = useMemo(() => getFuelEconomyProfile(fuelProfileId), [fuelProfileId])
  const fuelRange = useMemo(() => getFuelEconomyRange(fuelProfileId, trafficMode), [fuelProfileId, trafficMode])
  const fuelMidpoint = useMemo(() => getFuelEconomyMidpoint(fuelProfileId, trafficMode), [fuelProfileId, trafficMode])

  const routeDurationMin = useMemo(() => {
    if (!route) return 0
    return getPhilippinesAdjustedDuration(route.distance, route.providerDuration ?? route.duration, trafficMode)
  }, [route, trafficMode])

  const alternateDurationMin = useMemo(() => {
    if (!alternateRoute) return null
    return getPhilippinesAdjustedDuration(alternateRoute.distance, alternateRoute.providerDuration ?? alternateRoute.duration, trafficMode)
  }, [alternateRoute, trafficMode])

  const nearbyStations = useMemo<NearbyStation[]>(() => {
    if (!route || gaswatchStations.length === 0) return []
    return getNearbyStations(gaswatchStations, route, GASWATCH_RADIUS_KM, {
      fuelType: targetFuelType,
      fuelProfileId,
      trafficMode,
      fillVolumeLiters,
    })
  }, [fillVolumeLiters, fuelProfileId, gaswatchStations, route, targetFuelType, trafficMode])

  const recommendedStationId = nearbyStations[0]?.id ?? null

  const displayedSelectedStation = useMemo(() => {
    if (!route || !selectedStationId || !selectedStation) return null
    const station = nearbyStations.find((item) => item.id === selectedStationId)
    if (!station) return null

    const isAlongRoute = selectedStation.isAlongRoute
    if (!isAlongRoute && !alternateRoute) return null

    return createStationDecision({
      station,
      route,
      alternateRoute: isAlongRoute ? null : alternateRoute,
      isAlongRoute,
      routeDurationMin,
      alternateDurationMin: isAlongRoute ? null : alternateDurationMin,
      fuelProfileId,
      trafficMode,
      fillVolumeLiters,
    })
  }, [
    alternateDurationMin,
    alternateRoute,
    fillVolumeLiters,
    fuelProfileId,
    nearbyStations,
    route,
    routeDurationMin,
    selectedStation,
    selectedStationId,
    trafficMode,
  ])

  const clearStationSelection = useCallback(() => {
    setSelectedStationId(null)
    setSelectedStation(null)
    setAlternateRoute(null)
  }, [])

  const resolveStartPoint = useCallback(async () => {
    if (!startAddress.trim()) return null
    if (resolvedStartPoint?.address === startAddress) return resolvedStartPoint

    const startPoint = await geocodeAddress(startAddress)
    if (startPoint) setResolvedStartPoint(startPoint)
    return startPoint
  }, [geocodeAddress, resolvedStartPoint, startAddress])

  const calculateRouteForDestination = useCallback(
    async (destination?: RoutePoint) => {
      setCalculatingRoute(true)
      setFormError(null)
      clearStationSelection()

      try {
        const startPoint = await resolveStartPoint()
        if (!startPoint) {
          setFormError('Add a valid starting point first.')
          return
        }

        const endPoint = destination ?? (await geocodeAddress(endAddress))
        if (!endPoint) {
          setFormError('Add a valid destination.')
          return
        }

        const calculatedRoute = await calculateRoute(startPoint, endPoint)
        if (calculatedRoute) {
          setRoute(calculatedRoute)
          setEndAddress(endPoint.address)
        }
      } finally {
        setCalculatingRoute(false)
      }
    },
    [calculateRoute, clearStationSelection, endAddress, geocodeAddress, resolveStartPoint],
  )

  const loadRecommendations = useCallback(
    async (isNew = true) => {
      if (!startAddress.trim()) {
        setRecommendedDestinations([])
        setRecommendationsError(null)
        setRecommendationVisibleCount(4)
        setHasMoreRecommendations(true)
        return
      }

      setRecommendationsLoading(true)
      setRecommendationsError(null)
      if (isNew) {
        setRecommendationVisibleCount(4)
        setHasMoreRecommendations(true)
        setRecommendedDestinations([])
      }
      try {
        const startPoint = await resolveStartPoint()
        if (!startPoint) {
          setRecommendedDestinations([])
          setRecommendationsError('Choose a clearer starting point to load nearby destinations.')
          setRecommendationVisibleCount(4)
          return
        }

        const nextOffset = isNew ? 0 : recommendationsOffsetRef.current + 5
        const results = await fetchRecommendedDestinations(startPoint.lat, startPoint.lng, nextOffset)
        setRecommendedDestinations((current) => (isNew ? uniqueSuggestions(results) : uniqueSuggestions([...current, ...results])))
        setHasMoreRecommendations(results.length > 0)
        recommendationsOffsetRef.current = nextOffset
      } finally {
        setRecommendationsLoading(false)
      }
    },
    [fetchRecommendedDestinations, resolveStartPoint, startAddress],
  )

  const handleShowMoreRecommendations = useCallback(() => {
    const nextVisibleCount = recommendationVisibleCount + 4
    setRecommendationVisibleCount(nextVisibleCount)

    if (hasMoreRecommendations && nextVisibleCount >= recommendedDestinations.length) {
      void loadRecommendations(false)
    }
  }, [hasMoreRecommendations, loadRecommendations, recommendationVisibleCount, recommendedDestinations.length])

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
    const timeout = window.setTimeout(async () => {
      if (endAddress.trim() && showDestSuggestions) {
        const suggestions = await fetchAutocompleteSuggestions(endAddress)
        setDestSuggestions(suggestions.slice(0, 5))
      } else {
        setDestSuggestions([])
      }
    }, 400)
    return () => window.clearTimeout(timeout)
  }, [endAddress, fetchAutocompleteSuggestions, showDestSuggestions])

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      if (startAddress.trim() && showStartSuggestions) {
        const suggestions = await fetchAutocompleteSuggestions(startAddress)
        setStartSuggestions(suggestions.slice(0, 5))
      } else {
        setStartSuggestions([])
      }
    }, 400)
    return () => window.clearTimeout(timeout)
  }, [fetchAutocompleteSuggestions, showStartSuggestions, startAddress])

  useEffect(() => {
    if (!startAddress.trim()) {
      const timeout = window.setTimeout(() => {
        setRecommendedDestinations([])
        setRecommendationsError(null)
        setRecommendationVisibleCount(4)
        setHasMoreRecommendations(true)
      }, 0)
      return () => window.clearTimeout(timeout)
    }

    const timeout = window.setTimeout(() => {
      void loadRecommendations(true)
    }, 650)

    return () => window.clearTimeout(timeout)
  }, [loadRecommendations, startAddress])

  async function handleCalculateRoute(e: React.FormEvent) {
    e.preventDefault()
    await calculateRouteForDestination()
  }

  async function handleUseRecommendation(place: RoutePoint) {
    setEndAddress(place.address)
    setShowDestSuggestions(false)
    await calculateRouteForDestination(place)
  }

  async function handleSelectStation(station: NearbyStation) {
    if (!route) return

    if (selectedStationId === station.id) {
      clearStationSelection()
      return
    }

    setSelectedStationId(station.id)
    setSelectedStation(null)
    setAlternateRoute(null)
    setCalculatingAlternate(true)

    try {
      const alongRoute = isStationAlongRoute(route, station)
      if (alongRoute) {
        setSelectedStation(
          createStationDecision({
            station,
            route,
            alternateRoute: null,
            isAlongRoute: true,
            routeDurationMin,
            alternateDurationMin: null,
            fuelProfileId,
            trafficMode,
            fillVolumeLiters,
          }),
        )
        return
      }

      const stationPoint: RoutePoint = {
        lat: station.lat,
        lng: station.lng,
        address: `${station.name}${station.area ? `, ${station.area}` : ''}`,
        name: station.name,
      }
      const detourRoute = await calculateRouteWithWaypoints([route.startPoint, stationPoint, route.endPoint])

      if (!detourRoute) {
        setFormError('Could not calculate a detour route for that station.')
        return
      }

      const detourDuration = getPhilippinesAdjustedDuration(
        detourRoute.distance,
        detourRoute.providerDuration ?? detourRoute.duration,
        trafficMode,
      )

      setAlternateRoute(detourRoute)
      setSelectedStation(
        createStationDecision({
          station,
          route,
          alternateRoute: detourRoute,
          isAlongRoute: false,
          routeDurationMin,
          alternateDurationMin: detourDuration,
          fuelProfileId,
          trafficMode,
          fillVolumeLiters,
        }),
      )
    } finally {
      setCalculatingAlternate(false)
    }
  }

  async function handleSubmitPriceCallout(station: NearbyStation) {
    const parsedPrice = Number(calloutPrice)
    if (!Number.isFinite(parsedPrice)) {
      setCalloutMessage('Enter a valid price first.')
      return
    }

    setCalloutPending(true)
    setCalloutMessage(null)
    try {
      const result = await submitExternalPriceReportAction({
        station: {
          externalId: `gaswatch-${station.id}`,
          name: station.name,
          brand: station.brand,
          area: station.area ?? null,
          lat: station.lat,
          lng: station.lng,
        },
        fuelType: calloutFuelType,
        reportedPrice: parsedPrice,
      })

      if (result?.error) {
        setCalloutMessage(result.error)
        return
      }

      setCalloutPrice('')
      setPriceCalloutStationId(null)
      setCalloutMessage('Price callout submitted. It needs 4 community confirmations before it updates the live map price.')
    } catch {
      setCalloutMessage('Could not submit this price callout. Please try again.')
    } finally {
      setCalloutPending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Card padding="lg">
          <div className="mb-5 flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Plan Your Route</h2>
            <p className="text-sm text-muted-foreground">Choose a start point, pick a destination, then compare fuel stops nearby.</p>
          </div>

          <form onSubmit={handleCalculateRoute} className="space-y-5">
            <div className="space-y-2" ref={startRef}>
              <label className="text-sm font-medium">Starting point</label>
              <div className="relative">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex-1 min-w-0">
                    <Input
                      placeholder="Enter city, mall, street, or landmark"
                      value={startAddress}
                      onChange={(e) => {
                        setStartAddress(e.target.value)
                        setResolvedStartPoint(null)
                        setShowStartSuggestions(true)
                      }}
                      onFocus={() => setShowStartSuggestions(true)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (!userLocation) return
                      const point = {
                        lat: userLocation.lat,
                        lng: userLocation.lng,
                        address: 'Your current location',
                      }
                      setStartAddress(point.address)
                      setResolvedStartPoint(point)
                      setShowStartSuggestions(false)
                    }}
                    disabled={!userLocation}
                    className="shrink-0"
                  >
                    Use Current
                  </Button>
                </div>
                {showStartSuggestions && startSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                    {startSuggestions.map((suggestion) => (
                      <button
                        key={suggestionKey(suggestion)}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          setStartAddress(suggestion.address)
                          setResolvedStartPoint(suggestion)
                          setShowStartSuggestions(false)
                        }}
                      >
                        {suggestion.address}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2" ref={destRef}>
              <label className="text-sm font-medium">Destination</label>
              <div className="relative">
                <Input
                  placeholder="Enter destination or choose a suggestion"
                  value={endAddress}
                  onChange={(e) => {
                    setEndAddress(e.target.value)
                    setShowDestSuggestions(true)
                  }}
                  onFocus={() => setShowDestSuggestions(true)}
                />
                {showDestSuggestions && destSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                    {destSuggestions.map((suggestion) => (
                      <button
                        key={suggestionKey(suggestion)}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          setEndAddress(suggestion.address)
                          setShowDestSuggestions(false)
                        }}
                      >
                        {suggestion.address}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background/60 p-4">
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Recommended destinations</h3>
                  <p className="text-xs text-muted-foreground">Auto-suggested after your starting point is ready.</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void loadRecommendations(true)}
                  disabled={!startAddress.trim() || recommendationsLoading}
                  className="mt-2 sm:mt-0"
                >
                  Refresh
                </Button>
              </div>

              {!startAddress.trim() ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  Add your starting point to see places nearby.
                </div>
              ) : recommendationsLoading && recommendedDestinations.length === 0 ? (
                <div className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">
                  Finding places near your start...
                </div>
              ) : recommendationsError ? (
                <div className="rounded-lg border border-fuel-red/30 bg-fuel-red/10 p-3 text-sm text-fuel-red">
                  {recommendationsError}
                </div>
              ) : recommendedDestinations.length === 0 ? (
                <div className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">
                  No suggestions found yet.
                </div>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {recommendedDestinations.slice(0, recommendationVisibleCount).map((place) => (
                    <button
                      key={suggestionKey(place)}
                      type="button"
                      onClick={() => void handleUseRecommendation(place)}
                      className="rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-fuel-green hover:bg-fuel-green/5"
                    >
                      <span className="block text-sm font-semibold text-foreground">{place.name ?? 'Suggested place'}</span>
                      <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">{place.address}</span>
                    </button>
                  ))}
                  {(hasMoreRecommendations || recommendationVisibleCount < recommendedDestinations.length) && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="md:col-span-2"
                      onClick={handleShowMoreRecommendations}
                      disabled={recommendationsLoading}
                    >
                      {recommendationsLoading ? 'Loading...' : 'Show more places'}
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border bg-background/60 p-4">
              <div className="mb-3 flex flex-col gap-1">
                <h3 className="text-sm font-semibold">Fuel profile</h3>
                <p className="text-xs text-muted-foreground">Used for detour cost and savings estimates in Philippine driving conditions.</p>
              </div>
              <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_150px]">
                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                  Fuel to compare
                  <select
                    value={targetFuelType}
                    onChange={(e) => {
                      const nextFuelType = e.target.value as FuelType
                      setTargetFuelType(nextFuelType)
                      setCalloutFuelType(nextFuelType)
                    }}
                    className="h-10 w-full min-w-0 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-fuel-green"
                  >
                    {APP_FUEL_TYPES.map((fuelType) => (
                      <option key={fuelType} value={fuelType}>
                        {APP_FUEL_LABELS[fuelType]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                  Engine displacement
                  <select
                    value={fuelProfileId}
                    onChange={(e) => setFuelProfileId(e.target.value)}
                    className="h-10 w-full min-w-0 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-fuel-green"
                  >
                    {FUEL_ECONOMY_PROFILES.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.displacement} - {profile.vehicleType}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                  Fill volume
                  <Input
                    type="number"
                    min={5}
                    max={100}
                    value={fillVolumeLiters}
                    onChange={(e) => setFillVolumeLiters(Math.max(5, Number(e.target.value) || DEFAULT_FILL_VOLUME))}
                  />
                </label>
              </div>
              <div className="mt-4 rounded-lg border border-border bg-card p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Traffic condition</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(Object.keys(TRAFFIC_MODE_LABELS) as TrafficMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTrafficMode(mode)}
                      className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                        trafficMode === mode
                          ? 'border-fuel-green bg-fuel-green text-white'
                          : 'border-border bg-background text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {TRAFFIC_MODE_LABELS[mode]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-card px-3 py-2">
                  <span className="block font-medium text-foreground">{fuelRange[0]}-{fuelRange[1]} km/L</span>
                  Expected range
                </div>
                <div className="rounded-lg border border-border bg-card px-3 py-2">
                  <span className="block font-medium text-foreground">{fuelMidpoint.toFixed(1)} km/L</span>
                  Calculator value
                </div>
                <div className="rounded-lg border border-border bg-card px-3 py-2">
                  <span className="block font-medium text-foreground">{classifyFuelEconomy(fuelMidpoint)}</span>
                  PH estimate
                </div>
              </div>
            </div>

            {(formError || error) && (
              <div className="rounded-lg border border-fuel-red/30 bg-fuel-red/10 p-3 text-sm text-fuel-red">
                {formError ?? error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={calculatingRoute || geocodingLoading}>
              {calculatingRoute ? 'Calculating route...' : 'Calculate Route'}
            </Button>
          </form>
        </Card>

      </div>

      {route && (
        <>
          <Card padding="lg">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">From</p>
                  <p className="font-medium">{route.startPoint.address}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">To</p>
                  <p className="font-medium">{route.endPoint.address}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-fuel-green/10 p-3">
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="text-2xl font-bold text-fuel-green">{formatDistance(route.distance)}</p>
                </div>
                <div className="rounded-lg bg-fuel-green/10 p-3">
                  <p className="text-xs text-muted-foreground">Estimated travel time</p>
                  <p className="text-2xl font-bold text-fuel-green">{formatMinutes(routeDurationMin)}</p>
                  <p className="text-[11px] text-muted-foreground">PH traffic-adjusted</p>
                </div>
              </div>
            </div>
            {alternateRoute && alternateDurationMin !== null && (
              <div className="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-600">
                <span className="font-semibold">Alternated Estimated Travel Time:</span> {formatMinutes(alternateDurationMin)}
              </div>
            )}
          </Card>

          <RouteMap
            route={route}
            loading={calculatingRoute || calculatingAlternate}
            nearbyStations={nearbyStations}
            alternateRoute={alternateRoute}
            selectedStationId={selectedStationId}
          />

          {nearbyStations.length > 0 && (
            <Card padding="lg">
              <div className="mb-4 flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Nearby Gas Stations</h3>
                <p className="text-sm text-muted-foreground">
                  Ranked by practical savings for {APP_FUEL_LABELS[targetFuelType].toLowerCase()}, route fit, and PH traffic time.
                </p>
              </div>
              <div className="grid gap-3">
                {nearbyStations.map((station) => {
                  const entries = getPriceEntries(station.prices)
                  const lowestPrice = getLowestPrice(station.prices)
                  const isRecommended = recommendedStationId === station.id
                  const isSelected = selectedStationId === station.id
                  const isDimmed = Boolean(selectedStationId) && !isSelected
                  const stationDecision = isSelected ? displayedSelectedStation : null

                  return (
                    <div
                      key={station.id}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                          : isRecommended
                            ? 'border-fuel-green/60 bg-fuel-green/10 hover:border-fuel-green'
                            : 'border-border bg-background hover:border-muted-foreground'
                      } ${isDimmed ? 'opacity-45 blur-[0.4px]' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-semibold text-foreground">{station.name}</div>
                            {isRecommended && (
                              <span className="rounded-full bg-fuel-green px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                Best practical stop
                              </span>
                            )}
                            {stationDecision?.isAlongRoute && (
                              <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                Along your route
                              </span>
                            )}
                            {stationDecision && !stationDecision.isAlongRoute && (
                              <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                Detour route
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {station.brand ?? 'Independent'}{station.area ? ` · ${station.area}` : ''} · {formatDistance(station.closestDistanceKm)} from endpoint
                            {station.isAlongRoute ? ' · along your route' : ` · ${formatDistance(station.distanceToRouteKm)} off-route`}
                          </div>
                        </div>
                        {(station.comparablePrice ?? lowestPrice) !== null && (
                          <div className="shrink-0 text-right text-xs font-semibold text-fuel-green">
                            {APP_FUEL_LABELS[targetFuelType]}<br />{formatCurrency(station.comparablePrice ?? lowestPrice ?? 0)}
                          </div>
                        )}
                      </div>

                      {entries.length > 0 ? (
                        <div className="mt-3 grid gap-1 text-xs sm:grid-cols-2 lg:grid-cols-3">
                          {entries.map((entry) => (
                            <div key={entry.fuelType} className="flex items-center justify-between gap-3 rounded bg-card px-2 py-1">
                              <span className="text-muted-foreground">{formatFuel(entry.fuelType)}</span>
                              <span className="font-medium text-foreground">{formatCurrency(entry.price)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 text-xs text-muted-foreground">No prices reported yet.</div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={isSelected ? 'secondary' : 'primary'}
                          onClick={() => void handleSelectStation(station)}
                        >
                          {isSelected ? 'Unselect stop' : 'Check this stop'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setPriceCalloutStationId(priceCalloutStationId === station.id ? null : station.id)
                            setCalloutFuelType(targetFuelType)
                            setCalloutMessage(null)
                          }}
                        >
                          Call out price
                        </Button>
                      </div>

                      {priceCalloutStationId === station.id && (
                        <div className="mt-3 rounded-lg border border-border bg-card p-3">
                          <div className="mb-3">
                            <p className="text-sm font-semibold text-foreground">Community price callout</p>
                            <p className="text-xs text-muted-foreground">
                              Submitted prices stay pending until 4 users confirm them.
                            </p>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                            <select
                              value={calloutFuelType}
                              onChange={(e) => setCalloutFuelType(e.target.value as FuelType)}
                              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-fuel-green"
                            >
                              {APP_FUEL_TYPES.map((fuelType) => (
                                <option key={fuelType} value={fuelType}>
                                  {APP_FUEL_LABELS[fuelType]}
                                </option>
                              ))}
                            </select>
                            <Input
                              type="number"
                              min={10}
                              max={500}
                              step="0.01"
                              placeholder="Price per liter"
                              value={calloutPrice}
                              onChange={(e) => setCalloutPrice(e.target.value)}
                            />
                            <Button
                              type="button"
                              size="sm"
                              loading={calloutPending}
                              onClick={() => void handleSubmitPriceCallout(station)}
                            >
                              Submit
                            </Button>
                          </div>
                        </div>
                      )}

                      {isSelected && calculatingAlternate && !stationDecision && (
                        <div className="mt-4 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
                          Checking if this stop is along your route...
                        </div>
                      )}

                      {stationDecision && (
                        <div className="mt-4 rounded-lg border border-border bg-card p-3">
                          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {stationDecision.isAlongRoute ? 'Good stop on your route' : 'Detour estimate'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Based on {fuelProfile.displacement}, {TRAFFIC_MODE_LABELS[trafficMode].toLowerCase()}, and a {fillVolumeLiters}L fill.
                              </p>
                            </div>
                            <div className={`text-sm font-bold ${stationDecision.netSavings > 0 ? 'text-fuel-green' : 'text-fuel-red'}`}>
                              Net {formatCurrency(stationDecision.netSavings)}
                            </div>
                          </div>
                          <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded bg-background p-2">
                              <span className="block text-muted-foreground">Extra distance</span>
                              <span className="font-semibold text-foreground">+{stationDecision.extraDistanceKm.toFixed(2)} km</span>
                            </div>
                            <div className="rounded bg-background p-2">
                              <span className="block text-muted-foreground">Extra time</span>
                              <span className="font-semibold text-foreground">+{formatMinutes(stationDecision.extraTimeMin)}</span>
                            </div>
                            <div className="rounded bg-background p-2">
                              <span className="block text-muted-foreground">Estimated savings</span>
                              <span className="font-semibold text-fuel-green">{formatCurrency(stationDecision.grossSavings)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {calloutMessage && (
                <div className="mt-4 rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
                  {calloutMessage}
                </div>
              )}
            </Card>
          )}

          {gaswatchStations.length > 0 && nearbyStations.length === 0 && (
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
