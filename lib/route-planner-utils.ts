import type { RouteInfo } from '@/types/route'
import type { FuelType } from '@/types/station'

export type GaswatchPriceMap = Record<string, number | null>

export type NearbyStation = {
  id: string
  name: string
  brand: string | null
  area?: string
  lat: number
  lng: number
  prices: GaswatchPriceMap
  closestDistanceKm: number
  distanceToRouteKm: number
  isAlongRoute: boolean
  recommendationScore: number
  estimatedAccessDistanceKm: number
  comparableFuelType: string | null
  comparablePrice: number | null
}

export type GaswatchStationLike = {
  id: number
  brand: string | null
  name: string
  area?: string
  lat: number
  lng: number
  prices: GaswatchPriceMap
}

export type TrafficMode = 'heavy' | 'mixed' | 'highway'

export type FuelEconomyProfile = {
  id: string
  displacement: string
  vehicleType: string
  mixed: [number, number]
  heavy: [number, number]
  highway: [number, number]
}

export type PriceEntry = {
  fuelType: string
  price: number
}

export type StationDecision = NearbyStation & {
  extraDistanceKm: number
  extraTimeMin: number
  travelFuelCost: number
  timeCost: number
  grossSavings: number
  netSavings: number
  isWorthIt: boolean
  isAlongRoute: boolean
  totalDistance: number
  totalDuration: number
  selectedFuelType: string | null
  stationPrice: number | null
  baselinePrice: number | null
  efficiencyKml: number
  fillVolumeLiters: number
}

export type StationRankingOptions = {
  fuelType: FuelType
  fuelProfileId: string
  trafficMode: TrafficMode
  fillVolumeLiters: number
}

export const GASWATCH_RADIUS_KM = 5
export const ALONG_ROUTE_THRESHOLD_KM = 0.3
export const ROUTE_CORRIDOR_RADIUS_KM = 1
export const DEFAULT_FILL_VOLUME = 30
export const DEFAULT_TIME_VALUE = 12
export const DEFAULT_TRAFFIC_MODE: TrafficMode = 'mixed'
export const DEFAULT_FUEL_PROFILE_ID = '1.5-gas'

export const PH_TRAFFIC_MINUTES_PER_KM: Record<TrafficMode, number> = {
  heavy: 14,
  mixed: 7,
  highway: 0.75,
}

export const PH_TRAFFIC_BUFFER_MINUTES: Record<TrafficMode, number> = {
  heavy: 3,
  mixed: 2,
  highway: 1,
}

export const APP_FUEL_TYPES: FuelType[] = ['diesel', 'gasoline', 'premium', 'kerosene', 'lpg']

export const APP_FUEL_LABELS: Record<FuelType, string> = {
  diesel: 'Diesel',
  gasoline: 'Gasoline',
  premium: 'Premium',
  kerosene: 'Kerosene',
  lpg: 'LPG',
}

export const PRICE_ORDER = [
  'diesel',
  'premiumDiesel',
  'unleaded',
  'egasoline',
  'premium95',
  'premium97',
  'kerosene',
]

export const FUEL_LABELS: Record<string, string> = {
  diesel: 'Diesel',
  premiumDiesel: 'Premium Diesel',
  unleaded: 'Unleaded 91',
  egasoline: 'E-Gasoline',
  premium95: 'Premium 95',
  premium97: 'Premium 97',
  kerosene: 'Kerosene',
  gasoline: 'Gasoline',
  premium: 'Premium',
  lpg: 'LPG',
}

const GASWATCH_FUEL_GROUPS: Record<FuelType, string[]> = {
  diesel: ['diesel', 'premiumDiesel'],
  gasoline: ['gasoline', 'unleaded', 'egasoline'],
  premium: ['premium', 'premium95', 'premium97'],
  kerosene: ['kerosene'],
  lpg: ['lpg'],
}

export const TRAFFIC_MODE_LABELS: Record<TrafficMode, string> = {
  heavy: 'Heavy traffic',
  mixed: 'Mixed',
  highway: 'Highway',
}

export const FUEL_ECONOMY_PROFILES: FuelEconomyProfile[] = [
  { id: '1.0-gas', displacement: '1.0L', vehicleType: 'Wigo, Mirage, Raize Turbo', mixed: [11, 15], heavy: [8, 11], highway: [18, 24] },
  { id: '1.3-gas', displacement: '1.3L', vehicleType: 'Vios 1.3, Avanza 1.3', mixed: [10, 14], heavy: [7, 10], highway: [17, 21] },
  { id: '1.5-gas', displacement: '1.5L', vehicleType: 'Vios, City, BR-V', mixed: [9, 13], heavy: [6, 9], highway: [16, 20] },
  { id: '1.6-gas', displacement: '1.6L', vehicleType: 'Altis, older Civic', mixed: [8, 11], heavy: [5, 8], highway: [14, 18] },
  { id: '1.8-gas', displacement: '1.8L', vehicleType: 'Corolla Cross, Civic RS', mixed: [7, 10], heavy: [5, 7], highway: [13, 17] },
  { id: '2.0-gas', displacement: '2.0L', vehicleType: 'CR-V, Camry, CX-5', mixed: [6, 9], heavy: [4.5, 7], highway: [11, 15] },
  { id: '2.4-gas', displacement: '2.4L', vehicleType: 'Santa Fe, Camry 2.4', mixed: [5, 8], heavy: [4, 6], highway: [10, 13] },
  { id: '2.5-gas', displacement: '2.5L', vehicleType: 'CX-8, RAV4, Hilux', mixed: [5, 8], heavy: [4, 6], highway: [10, 14] },
  { id: '2.8-diesel', displacement: '2.8L Diesel', vehicleType: 'Fortuner, Innova, Hilux', mixed: [8, 12], heavy: [6, 9], highway: [13, 17] },
  { id: '3.0-diesel-gas', displacement: '3.0L Diesel/Gas', vehicleType: 'Older Montero, Fortuner 3.0', mixed: [6, 10], heavy: [5, 7], highway: [11, 15] },
  { id: '3.5-gas', displacement: '3.5L', vehicleType: 'V6 SUVs, Alphard, Explorer', mixed: [4, 7], heavy: [3, 5], highway: [8, 12] },
]

type LatLng = { lat: number; lng: number }
type RouteCoordinates = RouteInfo['coordinates']

const toRadians = (value: number) => (value * Math.PI) / 180

export function getDistanceKm(from: LatLng, to: LatLng) {
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

export function flattenRouteCoords(coords: RouteCoordinates | unknown): LatLng[] {
  const flat: Array<[number, number]> = []

  function visit(value: unknown) {
    if (!Array.isArray(value)) return
    if (typeof value[0] === 'number' && typeof value[1] === 'number') {
      flat.push([value[0], value[1]])
      return
    }
    for (const item of value) {
      visit(item)
    }
  }

  visit(coords)

  return flat
    .map((pair) => {
      const [first, second] = pair
      if (Math.abs(first) <= 90 && Math.abs(second) > 90) {
        return { lat: first, lng: second }
      }
      return { lat: second, lng: first }
    })
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
}

export function normalizeRouteCoordinates(coords: RouteCoordinates | unknown): Array<[number, number]> {
  return flattenRouteCoords(coords).map((point) => [point.lat, point.lng])
}

export function formatFuel(fuelType: string) {
  return FUEL_LABELS[fuelType] ?? fuelType
}

export function getPriceEntries(prices: GaswatchPriceMap): PriceEntry[] {
  const entries = Object.entries(prices)
    .filter(([, value]) => typeof value === 'number')
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

export function getLowestPriceEntry(prices: GaswatchPriceMap): PriceEntry | null {
  const entries = getPriceEntries(prices)
  if (entries.length === 0) return null
  return entries.reduce((lowest, entry) => (entry.price < lowest.price ? entry : lowest), entries[0])
}

export function getLowestPrice(prices: GaswatchPriceMap) {
  return getLowestPriceEntry(prices)?.price ?? null
}

export function getComparableFuelPrice(prices: GaswatchPriceMap, fuelType: FuelType): PriceEntry | null {
  const keys = GASWATCH_FUEL_GROUPS[fuelType]
  const entries = keys
    .map((key) => ({ fuelType: key, price: prices[key] }))
    .filter((entry): entry is PriceEntry => typeof entry.price === 'number')

  if (entries.length === 0) return getLowestPriceEntry(prices)
  return entries.reduce((lowest, entry) => (entry.price < lowest.price ? entry : lowest), entries[0])
}

export function getFuelEconomyProfile(profileId: string) {
  return FUEL_ECONOMY_PROFILES.find((profile) => profile.id === profileId) ?? FUEL_ECONOMY_PROFILES[2]
}

export function getFuelEconomyRange(profileId: string, trafficMode: TrafficMode) {
  const profile = getFuelEconomyProfile(profileId)
  return profile[trafficMode]
}

export function getFuelEconomyMidpoint(profileId: string, trafficMode: TrafficMode) {
  const [min, max] = getFuelEconomyRange(profileId, trafficMode)
  return (min + max) / 2
}

export function classifyFuelEconomy(kml: number) {
  if (kml >= 15) return 'Excellent'
  if (kml >= 11) return 'Very good'
  if (kml >= 8) return 'Normal'
  if (kml >= 6) return 'Heavy traffic / larger engine'
  return 'Very heavy traffic'
}

export function getPhilippinesAdjustedDuration(distanceKm: number, providerDurationMin: number, trafficMode: TrafficMode = DEFAULT_TRAFFIC_MODE) {
  const provider = Number.isFinite(providerDurationMin) && providerDurationMin > 0 ? providerDurationMin : 0
  const adjustedDistanceKm = trafficMode === 'highway' ? distanceKm : Math.max(distanceKm, 1)
  const speedBased = adjustedDistanceKm * PH_TRAFFIC_MINUTES_PER_KM[trafficMode] + PH_TRAFFIC_BUFFER_MINUTES[trafficMode]
  const shortTripMinimum = trafficMode === 'highway' ? 1 : trafficMode === 'heavy' ? 10 : 7
  return Math.max(1, Math.ceil(Math.max(provider, speedBased, shortTripMinimum)))
}

export function getNearbyStations(
  stations: GaswatchStationLike[],
  route: RouteInfo,
  radiusKm = GASWATCH_RADIUS_KM,
  options?: StationRankingOptions,
): NearbyStation[] {
  const candidates: NearbyStation[] = []
  const fuelType = options?.fuelType ?? 'diesel'
  const fillVolumeLiters = options?.fillVolumeLiters ?? DEFAULT_FILL_VOLUME
  const trafficMode = options?.trafficMode ?? DEFAULT_TRAFFIC_MODE
  const fuelProfileId = options?.fuelProfileId ?? DEFAULT_FUEL_PROFILE_ID
  const efficiencyKml = getFuelEconomyMidpoint(fuelProfileId, trafficMode)

  for (const station of stations) {
    const stationPoint = { lat: station.lat, lng: station.lng }
    const distanceFromStart = getDistanceKm(route.startPoint, stationPoint)
    const distanceFromEnd = getDistanceKm(route.endPoint, stationPoint)
    const closestDistanceKm = Math.min(distanceFromStart, distanceFromEnd)
    const distanceToRouteKm = getDistanceToRouteKm(route, stationPoint)
    const isAlongRouteValue = distanceToRouteKm <= ALONG_ROUTE_THRESHOLD_KM
    const estimatedAccessDistanceKm = isAlongRouteValue ? 0 : Math.min(closestDistanceKm, distanceToRouteKm)
    const comparablePriceEntry = getComparableFuelPrice(station.prices, fuelType)
    const comparablePrice = comparablePriceEntry?.price ?? null

    if (closestDistanceKm <= radiusKm || distanceToRouteKm <= ROUTE_CORRIDOR_RADIUS_KM) {
      const accessRoundTripKm = estimatedAccessDistanceKm * 2
      const accessTimeMin = getPhilippinesAdjustedDuration(accessRoundTripKm, 0, trafficMode)
      const travelFuelCost = comparablePrice === null ? 0 : (accessRoundTripKm / efficiencyKml) * comparablePrice
      const accessTimeCost = accessTimeMin * DEFAULT_TIME_VALUE
      const inconvenienceCost = estimatedAccessDistanceKm * (trafficMode === 'heavy' ? 90 : 70)
      const routeBonus = isAlongRouteValue ? 180 : 0
      const missingPricePenalty = comparablePrice === null ? 10000 : 0
      const pumpCost = (comparablePrice ?? 999) * fillVolumeLiters
      const recommendationScore = pumpCost + travelFuelCost + accessTimeCost + inconvenienceCost + missingPricePenalty - routeBonus

      candidates.push({
        id: String(station.id),
        name: station.name,
        brand: station.brand,
        area: station.area,
        lat: station.lat,
        lng: station.lng,
        prices: station.prices,
        closestDistanceKm,
        distanceToRouteKm,
        isAlongRoute: isAlongRouteValue,
        recommendationScore,
        estimatedAccessDistanceKm,
        comparableFuelType: comparablePriceEntry?.fuelType ?? null,
        comparablePrice,
      })
    }
  }

  return candidates
    .sort((a, b) => {
      if (a.recommendationScore !== b.recommendationScore) {
        return a.recommendationScore - b.recommendationScore
      }
      const pa = a.comparablePrice ?? Infinity
      const pb = b.comparablePrice ?? Infinity
      if (pa !== pb) return pa - pb
      return a.closestDistanceKm - b.closestDistanceKm
    })
    .slice(0, 10)
}

function projectKm(point: LatLng, origin: LatLng) {
  const meanLat = toRadians((point.lat + origin.lat) / 2)
  return {
    x: (point.lng - origin.lng) * 111.32 * Math.cos(meanLat),
    y: (point.lat - origin.lat) * 110.57,
  }
}

function distanceToSegmentKm(point: LatLng, a: LatLng, b: LatLng) {
  const p = projectKm(point, a)
  const start = { x: 0, y: 0 }
  const end = projectKm(b, a)
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSq = dx * dx + dy * dy

  if (lengthSq === 0) return getDistanceKm(point, a)

  const t = Math.max(0, Math.min(1, ((p.x - start.x) * dx + (p.y - start.y) * dy) / lengthSq))
  const closest = {
    x: start.x + t * dx,
    y: start.y + t * dy,
  }

  return Math.hypot(p.x - closest.x, p.y - closest.y)
}

export function getDistanceToRouteKm(route: RouteInfo, point: LatLng) {
  const points = flattenRouteCoords(route.coordinates)
  if (points.length < 2) {
    return Math.min(getDistanceKm(point, route.startPoint), getDistanceKm(point, route.endPoint))
  }

  let nearest = Infinity
  for (let i = 1; i < points.length; i += 1) {
    nearest = Math.min(nearest, distanceToSegmentKm(point, points[i - 1], points[i]))
  }
  return nearest
}

export function isStationAlongRoute(route: RouteInfo, station: LatLng, thresholdKm = ALONG_ROUTE_THRESHOLD_KM) {
  return getDistanceToRouteKm(route, station) <= thresholdKm
}

export function createStationDecision(params: {
  station: NearbyStation
  route: RouteInfo
  alternateRoute: RouteInfo | null
  isAlongRoute: boolean
  routeDurationMin: number
  alternateDurationMin: number | null
  fuelProfileId: string
  trafficMode: TrafficMode
  fillVolumeLiters: number
  timeValuePerMinute?: number
}) {
  const {
    station,
    route,
    alternateRoute,
    isAlongRoute,
    routeDurationMin,
    alternateDurationMin,
    fuelProfileId,
    trafficMode,
    fillVolumeLiters,
    timeValuePerMinute = DEFAULT_TIME_VALUE,
  } = params

  const priceEntry = station.comparableFuelType && station.comparablePrice !== null
    ? { fuelType: station.comparableFuelType, price: station.comparablePrice }
    : getLowestPriceEntry(station.prices)
  const stationPrice = priceEntry?.price ?? null
  const baselinePrice = stationPrice === null ? null : stationPrice + 2
  const totalDistance = isAlongRoute || !alternateRoute ? route.distance : alternateRoute.distance
  const totalDuration = isAlongRoute || alternateDurationMin === null ? routeDurationMin : alternateDurationMin
  const extraDistanceKm = Math.max(0, totalDistance - route.distance)
  const extraTimeMin = Math.max(0, totalDuration - routeDurationMin)
  const efficiencyKml = getFuelEconomyMidpoint(fuelProfileId, trafficMode)
  const travelFuelCost = stationPrice === null ? 0 : (extraDistanceKm / efficiencyKml) * stationPrice
  const timeCost = extraTimeMin * timeValuePerMinute
  const grossSavings = stationPrice === null || baselinePrice === null ? 0 : fillVolumeLiters * (baselinePrice - stationPrice)
  const netSavings = grossSavings - travelFuelCost - timeCost

  return {
    ...station,
    extraDistanceKm,
    extraTimeMin,
    travelFuelCost,
    timeCost,
    grossSavings,
    netSavings,
    isWorthIt: netSavings > 0,
    isAlongRoute,
    totalDistance,
    totalDuration,
    selectedFuelType: priceEntry?.fuelType ?? null,
    stationPrice,
    baselinePrice,
    efficiencyKml,
    fillVolumeLiters,
  } satisfies StationDecision
}
