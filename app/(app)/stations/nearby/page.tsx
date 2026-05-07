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
type TravelMode = 'ROUNDABOUT' | 'ONE_WAY' | 'TURNOVER'
type StopInsertionMode = 'AUTO' | 'OUTBOUND_STOP' | 'INBOUND_STOP'
type FuelConsumptionUnit = 'km/L' | 'L/100km' | 'L/km'
type GaswatchBrandMeta = {
  name?: string
  short?: string
  color?: string
  textColor?: string
}

type VehicleProfile = {
  brand: string
  model: string
  type: string
  year: string
  engineDisplacementLiters: string
  transmission: string
  fuelType: string
}

type StationDecision = {
  id: string
  name: string
  brand: string | null
  distanceKm: number
  etaMinutes: number
  stationPrice: number
  objectiveCost: number
  travelFuelCost: number
  timeCost: number
  deltaD: number
  deltaT: number
  netSavings: number
  feasible: boolean
  infeasibleReason?: string
  stopMode?: Exclude<StopInsertionMode, 'AUTO'>
}

const GASWATCH_RADIUS_KM = 5
const DEFAULT_CITY = 'Metro Manila'
const DEFAULT_PROVINCE = 'NCR'
const PRICE_ORDER = ['diesel', 'premiumDiesel', 'unleaded', 'egasoline', 'premium95', 'premium97', 'kerosene']
const TRINOMA_COORDS: Coordinates = { lat: 14.6528, lng: 121.0329 }
const TRINOMA_LABEL = 'Trinoma, Quezon City'
const MAKATI_COORDS: Coordinates = { lat: 14.5547, lng: 121.0244 }
const MAKATI_LABEL = 'Makati CBD'
const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY ?? ''
const DEFAULT_TARGET_FUEL_LITERS = 40
const DEFAULT_FUEL_CONSUMPTION_VALUE = 8 // km/L
const DEFAULT_FUEL_CONSUMPTION_UNIT: FuelConsumptionUnit = 'km/L'
const DEFAULT_TIME_VALUE_PHP_PER_MIN = 2
const DEFAULT_CURRENT_FUEL_LITERS = 12
const DEFAULT_RESERVE_FUEL_LITERS = 2
const DEFAULT_TANK_CAPACITY_LITERS = 45
const ROUTE_CORRIDOR_KM = 2
const ESTIMATED_SPEED_KPH = 30

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

const estimateMinutesForDistance = (distanceKm: number) => {
  if (distanceKm <= 0) return 0
  return Math.max(1, Math.round((distanceKm / ESTIMATED_SPEED_KPH) * 60))
}

const projectToPlane = (coords: Coordinates) => {
  const x = coords.lng * 111.32 * Math.cos(toRadians(coords.lat))
  const y = coords.lat * 110.574
  return { x, y }
}

const distancePointToSegmentKm = (point: Coordinates, start: Coordinates, end: Coordinates) => {
  const p = projectToPlane(point)
  const a = projectToPlane(start)
  const b = projectToPlane(end)

  const abx = b.x - a.x
  const aby = b.y - a.y
  const apx = p.x - a.x
  const apy = p.y - a.y
  const abLengthSquared = abx * abx + aby * aby
  if (abLengthSquared === 0) return Math.hypot(apx, apy)

  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLengthSquared))
  const closestX = a.x + t * abx
  const closestY = a.y + t * aby
  return Math.hypot(p.x - closestX, p.y - closestY)
}

const normalizeFuelConsumption = (value: number, unit: FuelConsumptionUnit): number => {
  if (value <= 0) return 0.1
  switch (unit) {
    case 'km/L': return 1 / value
    case 'L/100km': return value / 100
    case 'L/km': return value
    default: return value
  }
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
  const { coords, heading, loading: geoLoading, error: geoError, requestLocation, statusMessage, permission } = useGeolocation({ auto: true })
  const [locationMode, setLocationMode] = useState<'demo' | 'device'>('device')
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null)
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  const [selectedAlternativeStationId, setSelectedAlternativeStationId] = useState<string | null>(null)
  const [etaByStationId, setEtaByStationId] = useState<Record<string, number | null>>({})
  const [routeDistanceByStationId, setRouteDistanceByStationId] = useState<Record<string, number | null>>({})
  const [routeByStationId, setRouteByStationId] = useState<Record<string, Array<[number, number]> | Array<Array<[number, number]>> | null>>({})
  const [etaLoading, setEtaLoading] = useState(false)
  const [showUserMarker, setShowUserMarker] = useState(true)
  const [targetFuelLiters, setTargetFuelLiters] = useState(DEFAULT_TARGET_FUEL_LITERS)
  const [fuelConsumptionValue, setFuelConsumptionValue] = useState(DEFAULT_FUEL_CONSUMPTION_VALUE)
  const [fuelConsumptionUnit, setFuelConsumptionUnit] = useState<FuelConsumptionUnit>(DEFAULT_FUEL_CONSUMPTION_UNIT)
  const [timeValuePhpPerMin, setTimeValuePhpPerMin] = useState(DEFAULT_TIME_VALUE_PHP_PER_MIN)
  const [travelMode, setTravelMode] = useState<TravelMode>('ROUNDABOUT')
  const [stopInsertionMode, setStopInsertionMode] = useState<StopInsertionMode>('AUTO')
  const [destinationCoords, setDestinationCoords] = useState<Coordinates | null>(MAKATI_COORDS)
  const [homeCoords, setHomeCoords] = useState<Coordinates | null>(null)
  const [currentFuelLiters, setCurrentFuelLiters] = useState(DEFAULT_CURRENT_FUEL_LITERS)
  const [reserveFuelLiters, setReserveFuelLiters] = useState(DEFAULT_RESERVE_FUEL_LITERS)
  const [tankCapacityLiters, setTankCapacityLiters] = useState(DEFAULT_TANK_CAPACITY_LITERS)
  const [selectedFuelType, setSelectedFuelType] = useState<string>('diesel')
  const [vehicleProfile, setVehicleProfile] = useState<VehicleProfile | null>(null)
  const [isCarModalOpen, setIsCarModalOpen] = useState(false)
  const [carBrand, setCarBrand] = useState('')
  const [carType, setCarType] = useState('')
  const [carModel, setCarModel] = useState('')
  const [carYear, setCarYear] = useState('')
  const [carEngineDisplacement, setCarEngineDisplacement] = useState('')
  const [carTransmission, setCarTransmission] = useState('')
  const [carFuelType, setCarFuelType] = useState('')
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
      return res.json() as Promise<{ stations: GaswatchStation[]; brands?: Record<string, GaswatchBrandMeta> }>
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
      const normalizedFuel = (parsed.fuelType ?? '').toLowerCase()
      if (normalizedFuel.includes('diesel')) setSelectedFuelType('diesel')
      else setSelectedFuelType('unleaded')
    } catch {
      return
    }
  }, [])

  const gaswatchStations = useMemo(() => gaswatchData?.stations ?? [], [gaswatchData?.stations])
  const gaswatchBrands = useMemo(() => gaswatchData?.brands ?? {}, [gaswatchData?.brands])
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
    if (!activeCoords) {
      return []
    }

    return stationsWithDistance
      .filter((station) => (station.distanceKm ?? 0) <= GASWATCH_RADIUS_KM)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
  }, [activeCoords, stationsWithDistance])

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
  }, [displayedStations, hasActiveCoords])

  const etaStationsKey = useMemo(() => {
    return etaStations.map((station) => `${station.id}:${station.lat},${station.lng}`).join('|')
  }, [etaStations])

  const etaStationIds = useMemo(() => {
    return new Set(etaStations.map((station) => String(station.id)))
  }, [etaStations])

  useEffect(() => {
    if (!activeCoords || etaStations.length === 0 || !GEOAPIFY_API_KEY) {
      setEtaByStationId((prev) => (Object.keys(prev).length === 0 ? prev : {}))
      setRouteDistanceByStationId((prev) => (Object.keys(prev).length === 0 ? prev : {}))
      setRouteByStationId((prev) => (Object.keys(prev).length === 0 ? prev : {}))
      setEtaLoading(false)
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
              return { id: String(station.id), etaMinutes: null, routeDistanceKm: null, coordinates: null }
            }

            const data = (await response.json()) as GeoapifyRouteResponse
            const route = data.features?.[0]
            const etaMinutes = route ? Math.round((route.properties.time || 0) / 60) : null
            const routeDistanceKm = route ? (route.properties.distance || 0) / 1000 : null
            const coordinates = route?.geometry?.coordinates ?? null
            return { id: String(station.id), etaMinutes, routeDistanceKm, coordinates }
          })
        )

        if (cancelled) return

        const next: Record<string, number | null> = {}
        const nextDistances: Record<string, number | null> = {}
        const nextRoutes: Record<string, Array<[number, number]> | Array<Array<[number, number]>> | null> = {}
        results.forEach((result) => {
          next[result.id] = result.etaMinutes
          nextDistances[result.id] = result.routeDistanceKm
          nextRoutes[result.id] = result.coordinates
        })
        setEtaByStationId((prev) => {
          const prevKeys = Object.keys(prev)
          const nextKeys = Object.keys(next)
          if (prevKeys.length !== nextKeys.length) return next
          for (const key of nextKeys) {
            if (prev[key] !== next[key]) return next
          }
          return prev
        })
        setRouteDistanceByStationId(nextDistances)
        setRouteByStationId(nextRoutes)
      } catch (err) {
        if (!cancelled) {
          console.error('ETA calculation failed:', err)
          setEtaByStationId((prev) => (Object.keys(prev).length === 0 ? prev : {}))
          setRouteDistanceByStationId((prev) => (Object.keys(prev).length === 0 ? prev : {}))
          setRouteByStationId((prev) => (Object.keys(prev).length === 0 ? prev : {}))
        }
      } finally {
        if (!cancelled) setEtaLoading(false)
      }
    }

    fetchEtas()

    return () => {
      cancelled = true
    }
  }, [activeCoords, etaStations, etaStationsKey])

  const handleRecalibrate = () => {
    setLocationMode('device')
    setShowUserMarker(true)
    requestLocation()
  }

  const handleUseDemoLocation = () => {
    setLocationMode('demo')
    setShowUserMarker(true)
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

  const modeledStations = useMemo<StationDecision[]>(() => {
    const consumptionLPerKm = normalizeFuelConsumption(fuelConsumptionValue, fuelConsumptionUnit)
    const originCoords = activeCoords ?? TRINOMA_COORDS
    const destination = destinationCoords
    const home = homeCoords ?? originCoords

    const scenarioCandidates = gaswatchStations.filter((station) => {
      const stationCoords = { lat: station.lat, lng: station.lng }
      const toOrigin = getDistanceKm(originCoords, stationCoords)

      if (travelMode === 'ROUNDABOUT') {
        return toOrigin <= GASWATCH_RADIUS_KM
      }

      if (!destination) return false
      if (travelMode === 'ONE_WAY') {
        return distancePointToSegmentKm(stationCoords, originCoords, destination) <= ROUTE_CORRIDOR_KM
      }

      const onOutbound = distancePointToSegmentKm(stationCoords, originCoords, destination) <= ROUTE_CORRIDOR_KM
      const onInbound = distancePointToSegmentKm(stationCoords, destination, home) <= ROUTE_CORRIDOR_KM
      return onOutbound || onInbound
    })

    const entries = scenarioCandidates
      .map((station) => {
        const stationId = String(station.id)
        const stationPrice = station.prices[selectedFuelType]
        if (typeof stationPrice !== 'number') return null

        const distanceKm = getDistanceKm(originCoords, { lat: station.lat, lng: station.lng })
        const etaMinutes = etaByStationId[stationId] ?? estimateMinutesForDistance(distanceKm)

        return {
          id: stationId,
          name: station.name,
          brand: station.brand ?? null,
          distanceKm,
          etaMinutes,
          stationPrice,
          coords: { lat: station.lat, lng: station.lng }
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry != null)

    if (entries.length === 0) return []

    const pRef = entries.reduce((sum, entry) => sum + entry.stationPrice, 0) / entries.length

    const scored = entries.map((entry) => {
      const stationKey = String(entry.id).replace('gaswatch-', '')
      const drivingDistanceKm = routeDistanceByStationId[stationKey] ?? entry.distanceKm ?? 0
      
      let deltaD = 0
      let deltaT = 0

      const litersNeededToStation = drivingDistanceKm * consumptionLPerKm
      const usableFuelBeforeStop = Math.max(0, currentFuelLiters - reserveFuelLiters)
      let feasible = litersNeededToStation <= usableFuelBeforeStop
      let infeasibleReason: string | undefined
      let chosenStopMode: Exclude<StopInsertionMode, 'AUTO'> | undefined
      if (!feasible) {
        infeasibleReason = 'Insufficient pre-refuel fuel to safely reach this station.'
      }

      if (targetFuelLiters > tankCapacityLiters) {
        feasible = false
        infeasibleReason = 'Requested fill exceeds configured tank capacity.'
      }

      if (travelMode === 'ROUNDABOUT') {
        deltaD = drivingDistanceKm * 2
        deltaT = (etaByStationId[stationKey] ?? estimateMinutesForDistance(drivingDistanceKm)) * 2
      } else if (travelMode === 'ONE_WAY' && destination) {
        const distDirect = getDistanceKm(originCoords, destination)
        const distToStation = drivingDistanceKm
        const distStationToDest = getDistanceKm(entry.coords, destination)
        deltaD = Math.max(0, (distToStation + distStationToDest) - distDirect)

        const etaDirect = estimateMinutesForDistance(distDirect)
        const etaToStation = entry.etaMinutes
        const etaStationToDest = estimateMinutesForDistance(distStationToDest)
        deltaT = Math.max(0, (etaToStation + etaStationToDest) - etaDirect)
      } else if (travelMode === 'TURNOVER' && destination) {
        const directOutbound = getDistanceKm(originCoords, destination)
        const directInbound = getDistanceKm(destination, home)
        const baseDistance = directOutbound + directInbound
        const baseEta = estimateMinutesForDistance(directOutbound) + estimateMinutesForDistance(directInbound)

        const outboundDistanceWithStop =
          getDistanceKm(originCoords, entry.coords) +
          getDistanceKm(entry.coords, destination) +
          directInbound
        const inboundDistanceWithStop =
          directOutbound +
          getDistanceKm(destination, entry.coords) +
          getDistanceKm(entry.coords, home)

        const outboundDeltaD = Math.max(0, outboundDistanceWithStop - baseDistance)
        const inboundDeltaD = Math.max(0, inboundDistanceWithStop - baseDistance)

        const outboundEta =
          entry.etaMinutes +
          estimateMinutesForDistance(getDistanceKm(entry.coords, destination)) +
          estimateMinutesForDistance(directInbound)
        const inboundEta =
          estimateMinutesForDistance(directOutbound) +
          estimateMinutesForDistance(getDistanceKm(destination, entry.coords)) +
          estimateMinutesForDistance(getDistanceKm(entry.coords, home))

        const outboundDeltaT = Math.max(0, outboundEta - baseEta)
        const inboundDeltaT = Math.max(0, inboundEta - baseEta)

        const useOutbound = stopInsertionMode === 'OUTBOUND_STOP' || (stopInsertionMode === 'AUTO' && outboundDeltaD <= inboundDeltaD)
        chosenStopMode = useOutbound ? 'OUTBOUND_STOP' : 'INBOUND_STOP'
        deltaD = useOutbound ? outboundDeltaD : inboundDeltaD
        deltaT = useOutbound ? outboundDeltaT : inboundDeltaT
      }

      const postRefuelTripKm = travelMode === 'ROUNDABOUT'
        ? entry.distanceKm
        : travelMode === 'ONE_WAY' && destination
          ? getDistanceKm(entry.coords, destination)
          : travelMode === 'TURNOVER' && destination
            ? (chosenStopMode === 'INBOUND_STOP'
              ? getDistanceKm(entry.coords, home)
              : getDistanceKm(entry.coords, destination) + getDistanceKm(destination, home))
            : 0

      const postRefuelRequiredLiters = postRefuelTripKm * consumptionLPerKm + reserveFuelLiters
      if (postRefuelRequiredLiters > targetFuelLiters && feasible) {
        feasible = false
        infeasibleReason = 'Target fill may be insufficient for the remaining trip plus reserve.'
      }

      const travelFuelCost = deltaD * consumptionLPerKm * pRef
      const timeCost = deltaT * timeValuePhpPerMin
      const gasCost = targetFuelLiters * entry.stationPrice
      const objectiveCost = gasCost + travelFuelCost + timeCost

      const grossSavings = targetFuelLiters * (pRef - entry.stationPrice)
      const netSavings = grossSavings - travelFuelCost - timeCost

      return {
        ...entry,
        objectiveCost,
        travelFuelCost,
        timeCost,
        deltaD,
        deltaT,
        netSavings,
        feasible,
        infeasibleReason,
        stopMode: chosenStopMode,
      }
    })

    return scored.sort((a, b) => {
      if (a.feasible !== b.feasible) return a.feasible ? -1 : 1
      return a.objectiveCost - b.objectiveCost
    })
  }, [activeCoords, currentFuelLiters, destinationCoords, etaByStationId, fuelConsumptionUnit, fuelConsumptionValue, gaswatchStations, homeCoords, reserveFuelLiters, selectedFuelType, stopInsertionMode, tankCapacityLiters, targetFuelLiters, timeValuePhpPerMin, travelMode])

  const feasibleStations = modeledStations.filter((station) => station.feasible)
  const bestStation = feasibleStations[0] ?? null
  const nextBestStation = feasibleStations[1] ?? null
  const savingsVsNext = bestStation && nextBestStation ? nextBestStation.objectiveCost - bestStation.objectiveCost : null
  const highlightedStationId = selectedStationId || (bestStation ? `gaswatch-${bestStation.id}` : null) || selectedAlternativeStationId
  const activeRouteCoordinates = useMemo(() => {
    if (selectedStationId) {
      const stationKey = selectedStationId.replace('gaswatch-', '')
      if (routeByStationId[stationKey]) return routeByStationId[stationKey]
    }
    if (bestStation) {
      const bestKey = String(bestStation.id)
      if (routeByStationId[bestKey]) return routeByStationId[bestKey]
    }
    return null
  }, [bestStation, selectedStationId, routeByStationId])

  const alternativeRouteCoordinates = useMemo(() => {
    if (selectedAlternativeStationId && selectedAlternativeStationId !== selectedStationId && selectedAlternativeStationId !== (bestStation ? `gaswatch-${bestStation.id}` : null)) {
      const altKey = String(selectedAlternativeStationId).replace('gaswatch-', '')
      if (routeByStationId[altKey]) return routeByStationId[altKey]
    }
    return null
  }, [selectedAlternativeStationId, selectedStationId, bestStation, routeByStationId])

  const displayedMapStations = useMemo(() => {
    if (!showOnlySelected) return mapStations
    
    const highlightIds = new Set([
      bestStation ? `gaswatch-${bestStation.id}` : null,
      selectedStationId,
      selectedAlternativeStationId ? `gaswatch-${selectedAlternativeStationId}` : null
    ].filter(Boolean))
    
    if (highlightIds.size === 0) return mapStations
    
    return mapStations.filter(s => highlightIds.has(String(s.id)))
  }, [mapStations, showOnlySelected, bestStation, selectedStationId, selectedAlternativeStationId])

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
              variant="primary"
              size="sm"
              onClick={handleOpenCarModal}
            >
              {vehicleProfile ? 'Edit car' : 'Set car'}
            </Button>
            <div className="text-xs text-muted-foreground">Showing all stations within 5 km of your location.</div>
          </div>

          <div className="mb-6 grid gap-2 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground sm:grid-cols-4">
            <div>
              <span className="font-medium text-foreground">Mode:</span> Nearby only (5 km)
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
            <div className="mb-4 flex items-center gap-2 bg-card p-3 rounded-lg border border-border">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border text-fuel-green focus:ring-fuel-green"
                  checked={showOnlySelected}
                  onChange={(e) => setShowOnlySelected(e.target.checked)}
                />
                <span className="text-sm font-medium">Show only selected/recommended stations</span>
              </label>
            </div>
            <div className="relative">
              <StationMap
                stations={displayedMapStations}
                brandStyles={gaswatchBrands}
                userLat={activeCoords?.lat}
                userLng={activeCoords?.lng}
                userHeading={locationMode === 'device' ? heading : null}
                showUserMarker={showUserMarker}
                centerOnUser={locationMode === 'device' && !!coords}
                highlightStationId={highlightedStationId}
                onStationSelect={setSelectedStationId}
                showMarkerPopup={false}
                containerClassName="-mx-4 sm:-mx-6 lg:-mx-8 z-0"
                mapClassName="h-80 sm:h-[520px] lg:h-[620px]"
                routeCoordinates={activeRouteCoordinates}
                alternativeRouteCoordinates={alternativeRouteCoordinates}
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

        <aside className="h-fit max-h-[calc(100vh-8rem)] overflow-y-auto rounded-xl border border-border bg-card p-4 lg:sticky lg:top-24">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-foreground">Smart Station Optimizer</div>
              <div className="text-xs text-muted-foreground">
                Automatic ranking based on fuel price, ETA, distance, and route behavior.
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleOpenCarModal}>
              {vehicleProfile ? 'Edit car' : 'Set car'}
            </Button>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
            <div><span className="font-medium text-foreground">Location:</span> {locationLabel}</div>
            <div><span className="font-medium text-foreground">Candidates:</span> {modeledStations.length} {travelMode === 'ROUNDABOUT' ? '(within 5km)' : '(route corridor)'}</div>
            <div><span className="font-medium text-foreground">Vehicle:</span> {vehicleProfile ? 'Set' : 'Not set'}</div>
          </div>

          <div className="mt-4 grid gap-3 rounded-lg border border-border bg-background p-3 text-xs">
            <label className="flex flex-col gap-1 text-muted-foreground">
              Travel Purpose
              <select
                className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
                value={travelMode}
                onChange={(event) => setTravelMode(event.target.value as TravelMode)}
              >
                <option value="ROUNDABOUT">Refuel and return home</option>
                <option value="ONE_WAY">Refuel on the way to destination</option>
                <option value="TURNOVER">Refuel for destination & return home</option>
              </select>
            </label>

            {travelMode !== 'ROUNDABOUT' && (
              <label className="flex flex-col gap-1 text-muted-foreground">
                Destination (Mock Coords)
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
                    value={destinationCoords?.lat ?? ''}
                    onChange={(e) => setDestinationCoords(prev => prev ? ({ ...prev, lat: Number(e.target.value) }) : { lat: Number(e.target.value), lng: 121.0244 })}
                    placeholder="Lat"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
                    value={destinationCoords?.lng ?? ''}
                    onChange={(e) => setDestinationCoords(prev => prev ? ({ ...prev, lng: Number(e.target.value) }) : { lat: 14.5547, lng: Number(e.target.value) })}
                    placeholder="Lng"
                  />
                </div>
              </label>
            )}

            {travelMode === 'TURNOVER' && (
              <>
                <label className="flex flex-col gap-1 text-muted-foreground">
                  Turnover stop insertion
                  <select
                    className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
                    value={stopInsertionMode}
                    onChange={(event) => setStopInsertionMode(event.target.value as StopInsertionMode)}
                  >
                    <option value="AUTO">Auto (least detour)</option>
                    <option value="OUTBOUND_STOP">Outbound stop</option>
                    <option value="INBOUND_STOP">Inbound stop</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-muted-foreground">
                  Home return point (optional)
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.0001"
                      className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
                      value={homeCoords?.lat ?? ''}
                      onChange={(e) => setHomeCoords(prev => prev ? ({ ...prev, lat: Number(e.target.value) }) : { lat: Number(e.target.value), lng: activeCoords?.lng ?? 121.0329 })}
                      placeholder="Home lat"
                    />
                    <input
                      type="number"
                      step="0.0001"
                      className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
                      value={homeCoords?.lng ?? ''}
                      onChange={(e) => setHomeCoords(prev => prev ? ({ ...prev, lng: Number(e.target.value) }) : { lat: activeCoords?.lat ?? 14.6528, lng: Number(e.target.value) })}
                      placeholder="Home lng"
                    />
                  </div>
                </label>
              </>
            )}

            <label className="flex flex-col gap-1 text-muted-foreground">
              Fuel type
              <select
                className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
                value={selectedFuelType}
                onChange={(event) => setSelectedFuelType(event.target.value)}
              >
                {PRICE_ORDER.map((fuelType) => (
                  <option key={fuelType} value={fuelType}>
                    {formatGaswatchFuel(fuelType)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-muted-foreground">
              F (liters to fill)
              <input
                type="number"
                min="1"
                step="1"
                className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
                value={targetFuelLiters}
                onChange={(event) => setTargetFuelLiters(Number(event.target.value) || DEFAULT_TARGET_FUEL_LITERS)}
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-muted-foreground">
                Fuel Consumption
                <input
                  type="number"
                  min="0.01"
                  step="0.1"
                  className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
                  value={fuelConsumptionValue}
                  onChange={(event) => setFuelConsumptionValue(Number(event.target.value) || DEFAULT_FUEL_CONSUMPTION_VALUE)}
                />
              </label>
              <label className="flex flex-col gap-1 text-muted-foreground">
                Unit
                <select
                  className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
                  value={fuelConsumptionUnit}
                  onChange={(event) => setFuelConsumptionUnit(event.target.value as FuelConsumptionUnit)}
                >
                  <option value="km/L">km/L</option>
                  <option value="L/100km">L/100km</option>
                  <option value="L/km">L/km</option>
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1 text-muted-foreground">
              Vt (PHP/min time value)
              <input
                type="number"
                min="0"
                step="0.5"
                className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
                value={timeValuePhpPerMin}
                onChange={(event) => setTimeValuePhpPerMin(Number(event.target.value) || DEFAULT_TIME_VALUE_PHP_PER_MIN)}
              />
            </label>

            <div className="grid grid-cols-3 gap-2">
              <label className="flex flex-col gap-1 text-muted-foreground">
                Current fuel (L)
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
                  value={currentFuelLiters}
                  onChange={(event) => setCurrentFuelLiters(Number(event.target.value) || DEFAULT_CURRENT_FUEL_LITERS)}
                />
              </label>
              <label className="flex flex-col gap-1 text-muted-foreground">
                Reserve (L)
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
                  value={reserveFuelLiters}
                  onChange={(event) => setReserveFuelLiters(Number(event.target.value) || DEFAULT_RESERVE_FUEL_LITERS)}
                />
              </label>
              <label className="flex flex-col gap-1 text-muted-foreground">
                Tank cap (L)
                <input
                  type="number"
                  min="10"
                  step="1"
                  className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
                  value={tankCapacityLiters}
                  onChange={(event) => setTankCapacityLiters(Number(event.target.value) || DEFAULT_TANK_CAPACITY_LITERS)}
                />
              </label>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">Dynamic Objective function</div>
            <div className="mt-1 font-mono text-[10px]">J_i = (F * P_i) + (ΔD_i * C * P_ref) + (ΔT_i * V_t)</div>
            <div className="mt-1 text-[10px]">ΔD: Marginal dist | ΔT: Marginal time</div>
          </div>

          <div className="mt-3 max-h-[40vh] overflow-y-auto rounded-lg border border-border bg-background p-3 text-xs">
            {bestStation ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-fuel-green/30 bg-fuel-green/10 p-3">
                  <div className="font-semibold text-foreground">Recommended: {bestStation.name}</div>
                  <div className="text-muted-foreground">
                    J* = PHP {bestStation.objectiveCost.toFixed(2)} | ΔT {bestStation.deltaT} min | ΔD {bestStation.deltaD.toFixed(2)} km
                  </div>
                  {bestStation.stopMode && (
                    <div className="mt-1 text-muted-foreground">Turnover insertion: {bestStation.stopMode === 'OUTBOUND_STOP' ? 'Outbound' : 'Inbound'}</div>
                  )}
                  {savingsVsNext != null && savingsVsNext > 0 && (
                    <div className="mt-1 text-fuel-green font-medium">Net Savings vs next option: PHP {savingsVsNext.toFixed(2)}</div>
                  )}
                  {bestStation.netSavings < 0 && (
                    <div className="mt-1 text-fuel-red font-medium">Note: Refuel cost outweighs detour savings.</div>
                  )}
                </div>

                {feasibleStations.slice(0, 10).map((decision, index) => (
                  <div 
                    key={decision.id} 
                    className={`rounded-lg border p-2 cursor-pointer transition-colors ${
                      selectedAlternativeStationId === decision.id 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-border hover:bg-muted'
                    }`}
                    onClick={() => {
                      if (selectedAlternativeStationId === decision.id) {
                        setSelectedAlternativeStationId(null)
                      } else {
                        setSelectedAlternativeStationId(decision.id)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-foreground">#{index + 1} {decision.name}</div>
                      {selectedAlternativeStationId === decision.id && (
                        <div className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded">Viewing Path</div>
                      )}
                    </div>
                    <div className="text-muted-foreground mt-1">
                      J_i PHP {decision.objectiveCost.toFixed(2)} = fuel PHP {(targetFuelLiters * decision.stationPrice).toFixed(2)} + detour PHP {decision.travelFuelCost.toFixed(2)} + time PHP {decision.timeCost.toFixed(2)}
                    </div>
                  </div>
                ))}

                {modeledStations.filter((entry) => !entry.feasible).slice(0, 3).map((entry) => (
                  <div key={`infeasible-${entry.id}`} className="rounded-lg border border-fuel-red/30 bg-fuel-red-light p-2 text-fuel-red">
                    <div className="font-medium">{entry.name} excluded</div>
                    <div>{entry.infeasibleReason ?? 'This station is currently not feasible for your fuel constraints.'}</div>
                  </div>
                ))}
              </div>
            ) : null}
            {!bestStation && (
              <div className="text-muted-foreground">No eligible stations with {formatGaswatchFuel(selectedFuelType)} pricing found within 5 km yet.</div>
            )}
            {bestStation && nextBestStation == null && (
              <div className="text-muted-foreground">Only one station currently has the required pricing for this fuel type.</div>
            )}
            {!GEOAPIFY_API_KEY && (
              <div className="text-fuel-red">Set NEXT_PUBLIC_GEOAPIFY_API_KEY to enable live ETA in the objective function.</div>
            )}
            {etaLoading && (
              <div className="text-muted-foreground">Refreshing ETA and objective score...</div>
            )}
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
