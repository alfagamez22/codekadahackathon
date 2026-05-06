'use server'
import 'server-only'

import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from './firestore'
import type { Station, StationListItem, FuelType, PriceSourceType } from '@/types/station'
import type { FuelPrice, PriceHistory, PriceSnapshot } from '@/types/price'
import type { UserProfile, UserRole } from '@/types/auth'

// ---------------------------------------------------------------------------
// Stations
// ---------------------------------------------------------------------------

export async function getStation(id: string): Promise<Station | null> {
  const snap = await adminDb.collection('stations').doc(id).get()
  if (!snap.exists) return null
  return { id: snap.id, ...snap.data() } as Station
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

  let query = adminDb.collection('stations').orderBy('name')

  if (province) query = query.where('province', '==', province) as typeof query
  if (city) query = query.where('city', '==', city) as typeof query
  if (brand) query = query.where('brand', '==', brand) as typeof query
  if (fuelType) query = query.where('fuelTypes', 'array-contains', fuelType) as typeof query

  const allSnap = await query.get()
  let docs = allSnap.docs

  // Client-side text search (Firestore doesn't support ILIKE)
  if (search) {
    const lower = search.toLowerCase()
    docs = docs.filter((d) => {
      const data = d.data()
      return (
        (data.name as string)?.toLowerCase().includes(lower) ||
        (data.brand as string)?.toLowerCase().includes(lower) ||
        (data.city as string)?.toLowerCase().includes(lower)
      )
    })
  }

  const total = docs.length
  const paginated = docs.slice((page - 1) * pageSize, page * pageSize)

  const stations: StationListItem[] = paginated.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      name: data.name,
      brand: data.brand ?? null,
      city: data.city,
      province: data.province,
      latitude: data.latitude,
      longitude: data.longitude,
      lowestPrice: data.lowestPrice ?? null,
      lowestFuelType: data.lowestFuelType ?? null,
    }
  })

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

  // Bounding box approximation (1 deg lat ≈ 111 km)
  const latDelta = radiusKm / 111
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180))

  let query = adminDb
    .collection('stations')
    .where('latitude', '>=', lat - latDelta)
    .where('latitude', '<=', lat + latDelta)

  if (fuelType) query = query.where('fuelTypes', 'array-contains', fuelType) as typeof query

  const snap = await query.get()

  const withDistance: (StationListItem & { distanceKm: number })[] = []

  for (const d of snap.docs) {
    const data = d.data()
    const sLat: number = data.latitude
    const sLng: number = data.longitude

    // Check lng bounds manually (Firestore only allows range on one field)
    if (sLng < lng - lngDelta || sLng > lng + lngDelta) continue

    const dLat = (sLat - lat) * (Math.PI / 180)
    const dLng = (sLng - lng) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat * Math.PI) / 180) * Math.cos((sLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    const distanceKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    if (distanceKm <= radiusKm) {
      withDistance.push({
        id: d.id,
        name: data.name,
        brand: data.brand ?? null,
        city: data.city,
        province: data.province,
        latitude: sLat,
        longitude: sLng,
        lowestPrice: data.lowestPrice ?? null,
        lowestFuelType: data.lowestFuelType ?? null,
        distanceKm,
      })
    }
  }

  withDistance.sort((a, b) => a.distanceKm - b.distanceKm)
  return withDistance.slice(0, limit)
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
  const now = new Date().toISOString()
  const ref = await adminDb.collection('stations').add({
    ...data,
    brand: data.brand ?? null,
    address: data.address ?? null,
    barangay: data.barangay ?? null,
    latestPrices: {},
    lastUpdatedAt: null,
    createdAt: now,
    updatedAt: now,
  })
  return ref.id
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
  }>
): Promise<void> {
  await adminDb
    .collection('stations')
    .doc(id)
    .update({ ...data, updatedAt: new Date().toISOString() })
}

export async function deleteStation(id: string): Promise<void> {
  await adminDb.collection('stations').doc(id).delete()

  // Also clean up associated fuel prices
  const pricesSnap = await adminDb.collection('fuelPrices').where('stationId', '==', id).get()
  const batch = adminDb.batch()
  pricesSnap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}

// ---------------------------------------------------------------------------
// Prices
// ---------------------------------------------------------------------------

export async function getCurrentPrices(stationId: string): Promise<FuelPrice[]> {
  const snap = await adminDb.collection('fuelPrices').where('stationId', '==', stationId).get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FuelPrice)
}

export async function getPriceHistory(params: {
  stationId: string
  fuelType?: FuelType
  from?: string
  to?: string
  limit?: number
}): Promise<PriceHistory[]> {
  const { stationId, fuelType, from, to, limit = 100 } = params

  let query = adminDb
    .collection('priceHistory')
    .where('stationId', '==', stationId)
    .orderBy('changedAt', 'desc')

  if (fuelType) query = query.where('fuelType', '==', fuelType) as typeof query
  if (from) query = query.where('changedAt', '>=', from) as typeof query
  if (to) query = query.where('changedAt', '<=', to) as typeof query

  const snap = await query.limit(limit).get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PriceHistory)
}

export async function upsertConfirmedPrice(data: {
  stationId: string
  fuelType: FuelType
  price: number
  sourceType: PriceSourceType
  confirmedReportId?: string
  confirmationCount?: number
}): Promise<void> {
  const docId = `${data.stationId}_${data.fuelType}`
  const priceRef = adminDb.collection('fuelPrices').doc(docId)
  const now = new Date().toISOString()

  const existing = await priceRef.get()
  const oldPrice = existing.exists ? (existing.data()?.currentPrice ?? null) : null

  await priceRef.set(
    {
      stationId: data.stationId,
      fuelType: data.fuelType,
      currentPrice: data.price,
      sourceType: data.sourceType,
      confirmedReportId: data.confirmedReportId ?? null,
      confirmationCount: data.confirmationCount ?? 0,
      updatedAt: now,
    },
    { merge: true }
  )

  // Write price history entry
  await adminDb.collection('priceHistory').add({
    stationId: data.stationId,
    fuelType: data.fuelType,
    oldPrice,
    newPrice: data.price,
    sourceType: data.sourceType,
    reportId: data.confirmedReportId ?? null,
    changedAt: now,
  })

  // Update lowestPrice on the station document
  const pricesSnap = await adminDb
    .collection('fuelPrices')
    .where('stationId', '==', data.stationId)
    .get()

  let lowestPrice: number | null = null
  let lowestFuelType: FuelType | null = null
  for (const d of pricesSnap.docs) {
    const p = d.data() as FuelPrice
    if (lowestPrice === null || p.currentPrice < lowestPrice) {
      lowestPrice = p.currentPrice
      lowestFuelType = p.fuelType
    }
  }

  await adminDb.collection('stations').doc(data.stationId).update({
    lowestPrice,
    lowestFuelType,
    lastUpdatedAt: now,
    updatedAt: now,
  })
}

export async function getBaselinePrices(_params: {
  fuelType?: FuelType
  brand?: string
  limit?: number
}): Promise<PriceSnapshot[]> {
  // TODO: query priceSnapshots collection once seeded by scraper cloud function
  return []
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function getUser(id: string): Promise<UserProfile | null> {
  const snap = await adminDb.collection('users').doc(id).get()
  if (!snap.exists) return null
  return { uid: snap.id, ...snap.data() } as UserProfile
}

export async function upsertUser(data: {
  id: string
  displayName?: string | null
  email?: string | null
  photoURL?: string | null
  role?: UserRole
}): Promise<void> {
  const now = new Date().toISOString()
  const ref = adminDb.collection('users').doc(data.id)
  const existing = await ref.get()

  if (existing.exists) {
    await ref.update({
      ...(data.displayName !== undefined && { displayName: data.displayName }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.photoURL !== undefined && { photoURL: data.photoURL }),
      updatedAt: now,
    })
  } else {
    await ref.set({
      displayName: data.displayName ?? null,
      email: data.email ?? null,
      photoURL: data.photoURL ?? null,
      role: data.role ?? 'user',
      trustScore: 0,
      reportCount: 0,
      confirmedReportCount: 0,
      createdAt: now,
      updatedAt: now,
    })
  }
}

export async function updateUserRole(id: string, role: UserRole): Promise<void> {
  await adminDb
    .collection('users')
    .doc(id)
    .update({ role, updatedAt: new Date().toISOString() })
}

export async function listUsers(params: {
  page?: number
  pageSize?: number
  role?: UserRole
}): Promise<{ users: UserProfile[]; total: number }> {
  const { page = 1, pageSize = 20, role } = params

  let query = adminDb.collection('users').orderBy('createdAt', 'desc')
  if (role) query = query.where('role', '==', role) as typeof query

  const allSnap = await query.get()
  const total = allSnap.size
  const paginated = allSnap.docs.slice((page - 1) * pageSize, page * pageSize)

  const users: UserProfile[] = paginated.map((d) => ({
    uid: d.id,
    ...d.data(),
  })) as UserProfile[]

  return { users, total }
}

export async function incrementUserReportCount(id: string, confirmed = false): Promise<void> {
  const update: Record<string, unknown> = {
    reportCount: FieldValue.increment(1),
    updatedAt: new Date().toISOString(),
  }
  if (confirmed) {
    update.confirmedReportCount = FieldValue.increment(1)
    update.trustScore = FieldValue.increment(5)
  }
  await adminDb.collection('users').doc(id).update(update)
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export async function getSystemStats() {
  const [stationsSnap, usersSnap, priceHistorySnap, fuelPricesSnap] = await Promise.all([
    adminDb.collection('stations').count().get(),
    adminDb.collection('users').count().get(),
    adminDb.collection('priceHistory').count().get(),
    adminDb.collection('fuelPrices').get(),
  ])

  // Compute average prices per fuel type from current fuelPrices
  const totals: Record<string, { sum: number; count: number }> = {}
  for (const d of fuelPricesSnap.docs) {
    const { fuelType, currentPrice } = d.data() as FuelPrice
    if (!totals[fuelType]) totals[fuelType] = { sum: 0, count: 0 }
    totals[fuelType].sum += currentPrice
    totals[fuelType].count += 1
  }

  const averagePrices = Object.entries(totals).map(([fuelType, { sum, count }]) => ({
    fuelType,
    avgPrice: Math.round((sum / count) * 100) / 100,
  }))

  return {
    stationCount: stationsSnap.data().count,
    reportCount: priceHistorySnap.data().count,
    userCount: usersSnap.data().count,
    averagePrices,
  }
}

export async function getTopContributors(limit = 10) {
  const snap = await adminDb
    .collection('users')
    .orderBy('confirmedReportCount', 'desc')
    .limit(limit)
    .get()

  return snap.docs.map((d) => {
    const data = d.data()
    return {
      uid: d.id,
      displayName: (data.displayName as string | null) ?? null,
      confirmedReportCount: (data.confirmedReportCount as number) ?? 0,
      trustScore: (data.trustScore as number) ?? 0,
    }
  })
}
