import 'server-only'
import { randomUUID } from 'crypto'
import { haversineKm } from '@/lib/utils/geo'
import { mockStations, stationToListItem } from '@/lib/mock-data'
import type { Station, StationListItem, FuelType } from '@/types/station'

export async function getStation(id: string): Promise<Station | null> {
  return mockStations.find((s) => s.id === id) ?? null
}

export async function searchStations(params: {
  province?: string
  city?: string
  brand?: string
  fuelType?: FuelType
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ stations: StationListItem[]; total: number }> {
  const { province, city, brand, fuelType, search, page = 1, pageSize = 20 } = params

  let all = [...mockStations]

  if (province) all = all.filter((s) => s.province?.toLowerCase().includes(province.toLowerCase()))
  if (city) all = all.filter((s) => s.city?.toLowerCase().includes(city.toLowerCase()))
  if (brand) all = all.filter((s) => s.brand?.toLowerCase().includes(brand.toLowerCase()))
  if (fuelType) all = all.filter((s) => s.fuelTypes?.includes(fuelType))
  if (search) {
    const q = search.toLowerCase()
    all = all.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.brand?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q),
    )
  }

  all.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  const total = all.length
  const offset = (page - 1) * pageSize
  const stations = all.slice(offset, offset + pageSize).map((s) => stationToListItem(s))

  return { stations, total }
}

export async function getNearbyStations(params: {
  lat: number
  lng: number
  radiusKm?: number
  fuelType?: FuelType
  limit?: number
}): Promise<StationListItem[]> {
  const { lat, lng, radiusKm = 5, fuelType, limit = 20 } = params

  const results: (StationListItem & { distanceKm: number })[] = []

  for (const station of mockStations) {
    if (fuelType && !station.fuelTypes?.includes(fuelType)) continue
    const distanceKm = haversineKm(lat, lng, station.latitude, station.longitude)
    if (distanceKm <= radiusKm) {
      results.push({ ...stationToListItem(station), distanceKm })
    }
  }

  return results.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, limit)
}

export async function createStation(data: {
  name: string
  brand?: string | null
  address?: string | null
  barangay?: string | null
  city: string
  province: string
  latitude: number
  longitude: number
  fuelTypes: FuelType[]
}): Promise<string> {
  const id = randomUUID()
  const nowIso = new Date().toISOString()

  const newStation: Station = {
    id,
    name: data.name,
    brand: data.brand ?? null,
    address: data.address ?? null,
    barangay: data.barangay ?? null,
    city: data.city,
    province: data.province,
    latitude: data.latitude,
    longitude: data.longitude,
    fuelTypes: data.fuelTypes,
    latestPrices: {},
    lastUpdatedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  }

  mockStations.push(newStation)
  return id
}

export async function updateStation(
  id: string,
  data: Partial<{
    name: string
    brand: string | null
    address: string | null
    barangay: string | null
    city: string
    province: string
    latitude: number
    longitude: number
    fuelTypes: FuelType[]
  }>,
): Promise<void> {
  const idx = mockStations.findIndex((s) => s.id === id)
  if (idx === -1) return
  mockStations[idx] = { ...mockStations[idx], ...data, updatedAt: new Date().toISOString() }
}

export async function deleteStation(id: string): Promise<void> {
  const idx = mockStations.findIndex((s) => s.id === id)
  if (idx !== -1) mockStations.splice(idx, 1)
}
