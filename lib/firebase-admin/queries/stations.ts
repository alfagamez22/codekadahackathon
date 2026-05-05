import 'server-only'
import { randomUUID } from 'crypto'
import { adminDb } from '../firestore'
import { haversineKm } from '@/lib/utils/geo'
import type { Station, StationListItem, FuelType } from '@/types/station'

function stationToListItem(station: Station): StationListItem {
  const entries = Object.entries(station.latestPrices ?? {}) as [FuelType, { price: number } | undefined][]
  const lowestEntry = entries.reduce<[FuelType, number] | null>((acc, [ft, sp]) => {
    if (!sp?.price) return acc
    if (!acc || sp.price < acc[1]) return [ft, sp.price]
    return acc
  }, null)

  return {
    id: station.id,
    name: station.name,
    brand: station.brand ?? null,
    city: station.city,
    province: station.province,
    latitude: station.latitude,
    longitude: station.longitude,
    lowestPrice: lowestEntry?.[1] ?? null,
    lowestFuelType: lowestEntry?.[0] ?? null,
  }
}

export async function getStation(id: string): Promise<Station | null> {
  const snap = await adminDb.collection('stations').doc(id).get()
  if (!snap.exists) return null
  return snap.data() as Station
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

  const snap = await adminDb.collection('stations').get()
  let all = snap.docs.map((d) => d.data() as Station)

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

  all.sort((a, b) => a.name.localeCompare(b.name))

  const total = all.length
  const offset = (page - 1) * pageSize
  const stations = all.slice(offset, offset + pageSize).map(stationToListItem)

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

  const snap = await adminDb.collection('stations').get()
  const results: (StationListItem & { distanceKm: number })[] = []

  for (const doc of snap.docs) {
    const station = doc.data() as Station
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

  await adminDb.collection('stations').doc(id).set({
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
  })

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
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) updates[k] = v
  }
  await adminDb.collection('stations').doc(id).update(updates)
}

export async function deleteStation(id: string): Promise<void> {
  await adminDb.collection('stations').doc(id).delete()

  const [pricesSnap, historySnap] = await Promise.all([
    adminDb.collection('fuelPrices').where('stationId', '==', id).get(),
    adminDb.collection('priceHistory').where('stationId', '==', id).get(),
  ])

  const batch = adminDb.batch()
  pricesSnap.docs.forEach((d) => batch.delete(d.ref))
  historySnap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}
