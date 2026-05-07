'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { StationMap } from '@/components/stations/station-map'
import { StationListSkeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { useGeolocation } from '@/hooks/use-geolocation'
import type { StationListItem } from '@/types/station'
import type { GeoapifyRouteResponse } from '@/types/route'
import { crowdSourcedStations } from '../../../../lib/crowdsourced-stations'

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

type GaswatchStationWithDistance = GaswatchStation & { distanceKm?: number }
type Coordinates = { lat: number; lng: number }
type VehicleProfile = {
  brand: string
  model: string
  type: string
  year: string
  engineDisplacementLiters: string
  transmission: string
  fuelType: string
}
type ChatMessage = { role: 'user' | 'assistant'; content: string }
type AiStationSummary = {
  id: string
  name: string
  brand: string | null
  area?: string
  distanceKm?: number
  etaMinutes: number | null
  prices: GaswatchPriceMap
}

const GASWATCH_RADIUS_KM = 5
const DEFAULT_CITY = 'Metro Manila'
const DEFAULT_PROVINCE = 'NCR'
const PRICE_ORDER = ['diesel', 'premiumDiesel', 'unleaded', 'egasoline', 'premium95', 'premium97', 'kerosene']
const TRINOMA_COORDS: Coordinates = { lat: 14.6528, lng: 121.0329 }
const TRINOMA_LABEL = 'Trinoma, Quezon City'
const ETA_TOP_COUNT = 10
const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || 'test-key'

const VEHICLE_MODELS: Record<string, Record<string, string[]>> = {
  Toyota: {
    SUV: ['Fortuner', 'RAV4', 'Rush', 'Land Cruiser Prado'],
    Sedan: ['Vios', 'Corolla Altis', 'Camry'],
    Hatchback: ['Yaris', 'Wigo'],
    MPV: ['Innova', 'Avanza'],
    Pickup: ['Hilux'],
  },
  Honda: {
    SUV: ['CR-V', 'HR-V', 'BR-V'],
    Sedan: ['Civic', 'City', 'Accord'],
    Hatchback: ['Jazz', 'Brio'],
    MPV: ['Odyssey', 'Mobilio'],
  },
  Mitsubishi: {
    SUV: ['Montero Sport', 'Pajero Sport', 'Outlander'],
    Sedan: ['Lancer EX', 'Mirage G4'],
    Hatchback: ['Mirage'],
    MPV: ['Xpander'],
    Pickup: ['Strada'],
  },
  Nissan: {
    SUV: ['Terra', 'X-Trail', 'Patrol'],
    Sedan: ['Almera', 'Sylphy', 'Sentra'],
    Hatchback: ['Note'],
    MPV: ['Livina'],
    Pickup: ['Navara'],
  },
  Hyundai: {
    SUV: ['Tucson', 'Santa Fe', 'Creta'],
    Sedan: ['Accent', 'Elantra'],
    Hatchback: ['i20', 'i10'],
    MPV: ['Staria'],
    Pickup: ['H-100'],
  },
}

const VEHICLE_YEARS = Array.from({ length: 20 }, (_, index) => String(new Date().getFullYear() - index))

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
  const [locationMode, setLocationMode] = useState<'demo' | 'device'>('demo')
  const [nearbyOnly, setNearbyOnly] = useState(true)
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null)
  const [etaByStationId, setEtaByStationId] = useState<Record<string, number | null>>({})
  const [etaLoading, setEtaLoading] = useState(false)
  const [showUserMarker, setShowUserMarker] = useState(true)
  const [vehicleProfile, setVehicleProfile] = useState<VehicleProfile | null>(null)
  const [isCarModalOpen, setIsCarModalOpen] = useState(false)
  const [carBrand, setCarBrand] = useState('')
  const [carType, setCarType] = useState('')
  const [carModel, setCarModel] = useState('')
  const [carYear, setCarYear] = useState('')
  const [carEngineDisplacement, setCarEngineDisplacement] = useState('')
  const [carTransmission, setCarTransmission] = useState('')
  const [carFuelType, setCarFuelType] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
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

  const {
    data: crowdStations,
    error: crowdStationsError,
  } = useQuery({
    queryKey: ['crowdsourced-stations'],
    queryFn: crowdSourcedStations,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (crowdStations) {
      console.info('Crowd-sourced stations response:', crowdStations)
    }
  }, [crowdStations])

  useEffect(() => {
    if (crowdStationsError) {
      console.error('Crowd-sourced stations request failed:', crowdStationsError)
    }
  }, [crowdStationsError])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem('vehicleProfile')
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as VehicleProfile
      if (!parsed?.brand || !parsed?.model) return
      setVehicleProfile(parsed)
      setCarBrand(parsed.brand)
      setCarType(parsed.type)
      setCarModel(parsed.model)
      setCarYear(parsed.year)
      setCarEngineDisplacement(parsed.engineDisplacementLiters ?? '')
      setCarTransmission(parsed.transmission ?? '')
      setCarFuelType(parsed.fuelType ?? '')
    } catch {
      return
    }
  }, [])

  const gaswatchStations = gaswatchData?.stations ?? []
  const activeCoords = locationMode === 'demo' ? TRINOMA_COORDS : coords
  const hasActiveCoords = activeCoords != null
  const stationsWithDistance = useMemo<GaswatchStationWithDistance[]>(() => {
    if (!activeCoords) return gaswatchStations

    return gaswatchStations.map((station) => ({
      ...station,
      distanceKm: getDistanceKm(activeCoords, { lat: station.lat, lng: station.lng }),
    }))
  }, [activeCoords, gaswatchStations])

  const displayedStations = useMemo(() => {
    if (!nearbyOnly || !activeCoords) {
      return [...stationsWithDistance].sort((a, b) => a.name.localeCompare(b.name))
    }

    return stationsWithDistance
      .filter((station) => (station.distanceKm ?? 0) <= GASWATCH_RADIUS_KM)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      .slice(0, 10)
  }, [activeCoords, nearbyOnly, stationsWithDistance])

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

  const etaStations = useMemo(() => {
    if (!hasActiveCoords) return []
    return [...displayedStations]
      .filter((station) => typeof station.distanceKm === 'number')
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      .slice(0, ETA_TOP_COUNT)
  }, [displayedStations, hasActiveCoords])

  const etaStationIds = useMemo(() => {
    return new Set(etaStations.map((station) => String(station.id)))
  }, [etaStations])

  const aiStations = useMemo<AiStationSummary[]>(() => {
    if (!activeCoords) return []
    return [...stationsWithDistance]
      .filter((station) => typeof station.distanceKm === 'number')
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      .slice(0, ETA_TOP_COUNT)
      .map((station) => ({
        id: String(station.id),
        name: station.name,
        brand: station.brand ?? null,
        area: station.area,
        distanceKm: station.distanceKm,
        etaMinutes: etaByStationId[String(station.id)] ?? null,
        prices: station.prices,
      }))
  }, [activeCoords, etaByStationId, stationsWithDistance])

  useEffect(() => {
    if (!activeCoords || etaStations.length === 0) {
      setEtaByStationId({})
      return
    }

    let cancelled = false

    const fetchEtas = async () => {
      setEtaLoading(true)
      try {
        const results = await Promise.all(
          etaStations.map(async (station) => {
            const response = await fetch(
              `https://api.geoapify.com/v1/routing?waypoints=${activeCoords.lat},${activeCoords.lng}|${station.lat},${station.lng}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`
            )

            if (!response.ok) {
              return { id: String(station.id), etaMinutes: null }
            }

            const data = (await response.json()) as GeoapifyRouteResponse
            const route = data.features?.[0]
            const etaMinutes = route ? Math.round((route.properties.time || 0) / 60) : null
            return { id: String(station.id), etaMinutes }
          })
        )

        if (cancelled) return

        const next: Record<string, number | null> = {}
        results.forEach((result) => {
          next[result.id] = result.etaMinutes
        })
        setEtaByStationId(next)
      } catch (err) {
        if (!cancelled) {
          console.error('ETA calculation failed:', err)
          setEtaByStationId({})
        }
      } finally {
        if (!cancelled) setEtaLoading(false)
      }
    }

    fetchEtas()

    return () => {
      cancelled = true
    }
  }, [activeCoords, etaStations])

  const handleRecalibrate = () => {
    setLocationMode('device')
    setShowUserMarker(true)
    requestLocation()
  }

  const handleUseDemoLocation = () => {
    setLocationMode('demo')
    setShowUserMarker(true)
  }

  const handleToggleNearby = () => {
    setNearbyOnly((prev) => !prev)
  }

  const handleOpenCarModal = () => {
    setIsCarModalOpen(true)
  }

  const handleCloseCarModal = () => {
    setIsCarModalOpen(false)
  }

  const handleSaveCar = () => {
    if (!carBrand || !carModel || !carYear || !carType || !carEngineDisplacement || !carTransmission || !carFuelType) return
    const nextProfile = {
      brand: carBrand,
      model: carModel,
      type: carType,
      year: carYear,
      engineDisplacementLiters: carEngineDisplacement,
      transmission: carTransmission,
      fuelType: carFuelType,
    }
    setVehicleProfile(nextProfile)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('vehicleProfile', JSON.stringify(nextProfile))
    }
    setIsCarModalOpen(false)
  }

  const handleClearCar = () => {
    setVehicleProfile(null)
    setCarBrand('')
    setCarType('')
    setCarModel('')
    setCarYear('')
    setCarEngineDisplacement('')
    setCarTransmission('')
    setCarFuelType('')
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('vehicleProfile')
    }
  }

  const locationLabel = locationMode === 'demo'
    ? TRINOMA_LABEL
    : coords
      ? 'Device location'
      : 'Location unavailable'

  const brandOptions = Object.keys(VEHICLE_MODELS)
  const typeOptions = carBrand ? Object.keys(VEHICLE_MODELS[carBrand]) : []
  const visibleTypes = carBrand ? (carType ? [carType] : typeOptions) : []
  const isCarFormValid = Boolean(
    carBrand &&
      carModel &&
      carYear &&
      carType &&
      carEngineDisplacement &&
      carTransmission &&
      carFuelType
  )

  const aiContext = useMemo(() => {
    return {
      location: locationLabel,
      vehicle: vehicleProfile,
      stations: aiStations,
    }
  }, [aiStations, locationLabel, vehicleProfile])

  const handleSendChat = async () => {
    const trimmed = chatInput.trim()
    if (!trimmed || chatLoading || aiStations.length === 0) return
    const nextMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: trimmed }]
    setChatMessages(nextMessages)
    setChatInput('')
    setChatError(null)
    setChatLoading(true)

    try {
      const response = await fetch('/api/ai/station-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, context: aiContext }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'AI request failed')
      }

      const data = (await response.json()) as { reply?: string }
      const reply = data.reply?.trim() || 'No response yet.'
      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI request failed'
      setChatError(message)
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Nearby Stations"
        description="Gas stations within 5 km of your location"
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Button
              variant={nearbyOnly ? 'primary' : 'ghost'}
              size="sm"
              onClick={handleToggleNearby}
              aria-pressed={nearbyOnly}
            >
              {nearbyOnly ? 'Nearby only: On' : 'Nearby only: Off'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCarModal}
            >
              {vehicleProfile ? 'Edit car' : 'Set car'}
            </Button>
            <div className="text-xs text-muted-foreground">
              {nearbyOnly
                ? 'Showing stations within 5 km, limited to 10 closest.'
                : 'Showing all stations from GasWatchPH.'}
            </div>
          </div>

          <div className="mb-6 grid gap-2 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground sm:grid-cols-4">
            <div>
              <span className="font-medium text-foreground">Mode:</span> {nearbyOnly ? 'Nearby only' : 'All stations'}
            </div>
            <div>
              <span className="font-medium text-foreground">Location:</span> {locationLabel}
            </div>
            <div>
              <span className="font-medium text-foreground">Showing:</span> {displayedStations.length} of {gaswatchStations.length}
            </div>
            <div>
              <span className="font-medium text-foreground">Vehicle:</span>{' '}
              {vehicleProfile
                ? `${vehicleProfile.brand} ${vehicleProfile.model} (${vehicleProfile.year}) · ${vehicleProfile.engineDisplacementLiters}L · ${vehicleProfile.transmission} · ${vehicleProfile.fuelType}`
                : 'Not set'}
            </div>
          </div>

      {locationMode === 'demo' && (
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="text-sm mb-3 text-muted-foreground">
            Using demo location: {TRINOMA_LABEL}. Recalibrate to use your device location.
          </div>
          <Button variant="primary" size="sm" onClick={handleRecalibrate}>
            Recalibrate location
          </Button>
        </div>
      )}

      {locationMode === 'device' && geoLoading && (
        <div className="text-center py-8 text-muted">
          <div className="text-3xl mb-2 animate-pulse">📍</div>
          <div>{statusMessage ?? 'Requesting your location...'}</div>
        </div>
      )}

      {locationMode === 'device' && !geoLoading && !coords && !geoError && (
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="text-sm mb-3 text-muted-foreground">
            Enable location to find stations near you.
          </div>
          <Button variant="primary" size="sm" onClick={handleRecalibrate}>
            Recalibrate location
          </Button>
        </div>
      )}

      {locationMode === 'device' && geoError && (
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
              onClick={handleRecalibrate}
              className="bg-fuel-red hover:bg-fuel-red/90"
            >
              Recalibrate location
            </Button>
          )}
          <div className="mt-3">
            <Button variant="ghost" size="sm" onClick={handleUseDemoLocation}>
              Use Trinoma demo
            </Button>
          </div>
        </div>
      )}

      {locationMode === 'device' && !geoLoading && !coords && !geoError && statusMessage && (
        <div className="text-sm text-muted-foreground mb-4">
          {statusMessage}
        </div>
      )}

      {hasActiveCoords && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
          <div>
            Location: {activeCoords.lat.toFixed(5)}, {activeCoords.lng.toFixed(5)}
          </div>
          {locationMode === 'device' && (
            <Button variant="ghost" size="sm" onClick={handleRecalibrate}>
              Recalibrate location
            </Button>
          )}
          {locationMode === 'device' && (
            <Button variant="ghost" size="sm" onClick={handleUseDemoLocation}>
              Use Trinoma demo
            </Button>
          )}
        </div>
      )}

      {!hasActiveCoords && (
        <div className="text-xs text-muted-foreground mb-4">
          Showing all stations. Enable location to filter within 5 km.
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
                userLat={activeCoords?.lat}
                userLng={activeCoords?.lng}
                showUserMarker={showUserMarker}
                onStationSelect={setSelectedStationId}
                showMarkerPopup={false}
                containerClassName="-mx-4 sm:-mx-6 lg:-mx-8 z-0"
                mapClassName="h-80 sm:h-[520px] lg:h-[620px]"
              />
              {selectedStation && (
                <div className="absolute left-1/2 top-4 z-10 w-[90%] max-w-md -translate-x-1/2 rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-foreground">{selectedStation.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {(selectedStation.brand ?? 'Independent')} - {selectedStation.city}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedStationId(null)}>
                      Close
                    </Button>
                  </div>
                  {(() => {
                    const entries = getPriceEntries(selectedStation.prices ?? {})

                    if (entries.length === 0) {
                      return <div className="mt-3 text-xs text-muted">No prices reported yet.</div>
                    }

                    return (
                      <div className="mt-3 grid gap-1 text-xs">
                        {entries.map((entry) => (
                          <div key={entry.fuelType} className="flex items-center justify-between">
                            <span className="text-muted-foreground">{formatGaswatchFuel(entry.fuelType)}</span>
                            <span className="font-medium text-foreground">PHP {entry.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>

          {displayedStations.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <div className="text-4xl mb-3">🔍</div>
              <div>{hasActiveCoords ? 'No stations found within 5 km. Try a wider search.' : 'No stations found yet. Try again later.'}</div>
            </div>
          ) : (
            <div className="grid gap-3">
              {displayedStations.map((station) => {
                const entries = getPriceEntries(station.prices)
                const stationKey = String(station.id)
                const etaMinutes = etaByStationId[stationKey]
                const showEta = etaStationIds.has(stationKey)

                return (
                  <div key={station.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-foreground">{station.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(station.brand ?? 'Independent')} - {station.area ?? DEFAULT_CITY}
                        </div>
                      </div>
                      <div className="text-xs text-muted text-right">
                        {station.distanceKm != null && (
                          <div>{station.distanceKm.toFixed(1)} km</div>
                        )}
                        {showEta && (
                          <div>
                            ETA:{' '}
                            {etaMinutes != null
                              ? `${etaMinutes} min`
                              : etaLoading
                                ? '...'
                                : 'unavailable'}
                          </div>
                        )}
                      </div>
                    </div>
                    {entries.length > 0 ? (
                      <div className="mt-2 grid gap-1 text-xs">
                        {entries.map((entry) => (
                          <div key={entry.fuelType} className="flex items-center justify-between">
                            <span className="text-muted-foreground">{formatGaswatchFuel(entry.fuelType)}</span>
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
          )}
            </>
          )}
        </div>

        <aside className="h-fit rounded-xl border border-border bg-card p-4 lg:sticky lg:top-24">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-foreground">AI Station Advisor</div>
              <div className="text-xs text-muted-foreground">
                Uses top {aiStations.length} nearby stations and your vehicle profile.
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleOpenCarModal}>
              {vehicleProfile ? 'Edit car' : 'Set car'}
            </Button>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
            <div><span className="font-medium text-foreground">Location:</span> {locationLabel}</div>
            <div><span className="font-medium text-foreground">Stations:</span> {aiStations.length}</div>
            <div><span className="font-medium text-foreground">Vehicle:</span> {vehicleProfile ? 'Set' : 'Not set'}</div>
          </div>

          <div className="mt-4 max-h-[50vh] overflow-y-auto rounded-lg border border-border bg-background p-3">
            {chatMessages.length === 0 ? (
              <div className="text-xs text-muted-foreground">
                Ask the AI to pick the best station based on price, ETA, and your vehicle profile.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {chatMessages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`rounded-lg px-3 py-2 text-xs ${message.role === 'user' ? 'bg-fuel-green text-white ml-auto' : 'bg-muted/40 text-foreground'}`}
                  >
                    {message.content}
                  </div>
                ))}
                {chatLoading && (
                  <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-foreground">Thinking...</div>
                )}
              </div>
            )}
          </div>

          {chatError && (
            <div className="mt-2 text-xs text-fuel-red">{chatError}</div>
          )}

          <div className="mt-3">
            <textarea
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              rows={3}
              placeholder="Ask: Which station is best for my car today?"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSendChat}
                disabled={chatLoading || !chatInput.trim() || aiStations.length === 0}
              >
                Ask AI
              </Button>
              <div className="text-[11px] text-muted-foreground">
                {aiStations.length === 0 ? 'No nearby stations available yet.' : 'Uses top 10 nearby stations.'}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {isCarModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-foreground">Set vehicle</div>
                <div className="text-xs text-muted-foreground">Saved locally on this device.</div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCloseCarModal}>
                Close
              </Button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Brand
                <select
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
                  value={carBrand}
                  onChange={(event) => {
                    const value = event.target.value
                    setCarBrand(value)
                    setCarType('')
                    setCarModel('')
                  }}
                >
                  <option value="">Select brand</option>
                  {brandOptions.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Type
                <select
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
                  value={carType}
                  onChange={(event) => {
                    const value = event.target.value
                    setCarType(value)
                    setCarModel('')
                  }}
                  disabled={!carBrand}
                >
                  <option value="">All types</option>
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Year
                <select
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
                  value={carYear}
                  onChange={(event) => setCarYear(event.target.value)}
                >
                  <option value="">Select year</option>
                  {VEHICLE_YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Engine (L)
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0.6"
                  max="8"
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
                  value={carEngineDisplacement}
                  onChange={(event) => setCarEngineDisplacement(event.target.value)}
                  placeholder="1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Transmission
                <select
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
                  value={carTransmission}
                  onChange={(event) => setCarTransmission(event.target.value)}
                >
                  <option value="">Select transmission</option>
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                  <option value="CVT">CVT</option>
                  <option value="Dual-clutch">Dual-clutch</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Fuel type
                <select
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
                  value={carFuelType}
                  onChange={(event) => setCarFuelType(event.target.value)}
                >
                  <option value="">Select fuel type</option>
                  <option value="Gasoline">Gasoline</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Electric">Electric</option>
                  <option value="LPG">LPG</option>
                </select>
              </label>
            </div>

            <div className="mt-4">
              {!carBrand && (
                <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
                  Choose a brand to see available models.
                </div>
              )}

              {carBrand && (
                <div className="space-y-4">
                  {visibleTypes.map((type) => (
                    <div key={type}>
                      <div className="text-xs font-semibold text-foreground">{type}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {VEHICLE_MODELS[carBrand][type].map((model) => (
                          <button
                            key={model}
                            type="button"
                            className={`rounded-full border px-3 py-1 text-xs transition-colors ${carModel === model ? 'border-fuel-green bg-fuel-green text-white' : 'border-border bg-background text-foreground hover:border-fuel-green'}`}
                            onClick={() => {
                              setCarModel(model)
                              setCarType(type)
                            }}
                          >
                            {model}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Button variant="ghost" size="sm" onClick={handleClearCar}>
                Clear selection
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCloseCarModal}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveCar} disabled={!isCarFormValid}>
                  Save vehicle
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
