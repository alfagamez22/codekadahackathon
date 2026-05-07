import 'server-only'
import { randomUUID } from 'crypto'
import { getAdminDb } from '../firestore'
import type { FuelPrice, PriceHistory, PriceSnapshot } from '@/types/price'
import type { FuelType, PriceSourceType } from '@/types/station'

export async function getCurrentPrices(stationId: string): Promise<FuelPrice[]> {
  const db = await getAdminDb()
  const snap = await db
    .collection('fuelPrices')
    .where('stationId', '==', stationId)
    .get()

  return snap.docs
    .map((d) => d.data() as FuelPrice)
    .sort((a, b) => (a.fuelType || '').localeCompare(b.fuelType || ''))
}

export async function getPriceHistory(params: {
  stationId: string
  fuelType?: FuelType
  from?: string
  to?: string
  limit?: number
}): Promise<PriceHistory[]> {
  const { stationId, fuelType, from, to, limit = 100 } = params

  const db = await getAdminDb()
  let query = db
    .collection('priceHistory')
    .where('stationId', '==', stationId)
    .orderBy('changedAt', 'desc')

  if (fuelType) query = query.where('fuelType', '==', fuelType) as typeof query
  if (from) query = query.where('changedAt', '>=', from) as typeof query
  if (to) query = query.where('changedAt', '<=', to) as typeof query

  const snap = await query.limit(limit).get()
  return snap.docs.map((d) => d.data() as PriceHistory)
}

export async function upsertConfirmedPrice(data: {
  stationId: string
  fuelType: FuelType
  price: number
  sourceType: PriceSourceType
  confirmedReportId?: string
  confirmationCount?: number
}): Promise<void> {
  const priceDocId = `${data.stationId}_${data.fuelType}`
  const nowIso = new Date().toISOString()

  const db = await getAdminDb()
  const existingSnap = await db.collection('fuelPrices').doc(priceDocId).get()
  const existingPrice = existingSnap.exists
    ? (existingSnap.data() as FuelPrice).currentPrice
    : null

  const priceData: FuelPrice = {
    id: priceDocId,
    stationId: data.stationId,
    fuelType: data.fuelType,
    currentPrice: data.price,
    sourceType: data.sourceType,
    confirmedReportId: data.confirmedReportId ?? null,
    confirmationCount: data.confirmationCount ?? 0,
    updatedAt: nowIso,
  }

  const historyId = randomUUID()
  const historyData: PriceHistory = {
    id: historyId,
    stationId: data.stationId,
    fuelType: data.fuelType,
    oldPrice: existingPrice,
    newPrice: data.price,
    sourceType: data.sourceType,
    reportId: data.confirmedReportId ?? null,
    changedAt: nowIso,
  }

  const badge =
    data.sourceType === 'admin'
      ? 'admin-verified'
      : data.sourceType === 'community'
        ? 'community-verified'
        : 'baseline'

  await Promise.all([
    db.collection('fuelPrices').doc(priceDocId).set(priceData),
    db.collection('priceHistory').doc(historyId).set(historyData),
    db.collection('stations').doc(data.stationId).update({
      [`latestPrices.${data.fuelType}`]: {
        price: data.price,
        sourceType: data.sourceType,
        badge,
        updatedAt: nowIso,
        confirmationCount: data.confirmationCount ?? 0,
      },
      lastUpdatedAt: nowIso,
      updatedAt: nowIso,
    }),
  ])
}

export async function getBaselinePrices(params: {
  fuelType?: FuelType
  brand?: string
  limit?: number
}): Promise<PriceSnapshot[]> {
  const { fuelType, brand, limit = 50 } = params

  const db = await getAdminDb()
  let query = db.collection('priceSnapshots').orderBy('scrapedAt', 'desc')

  if (fuelType) query = query.where('fuelType', '==', fuelType) as typeof query
  if (brand) query = query.where('brand', '==', brand) as typeof query

  const snap = await query.limit(limit).get()
  return snap.docs.map((d) => d.data() as PriceSnapshot)
}
