import 'server-only'
import { randomUUID } from 'crypto'
import { mockFuelPrices, mockPriceHistory, mockStations, mockPriceSnapshots } from '@/lib/mock-data'
import type { FuelPrice, PriceHistory, PriceSnapshot } from '@/types/price'
import type { FuelType, PriceSourceType } from '@/types/station'

export async function getCurrentPrices(stationId: string): Promise<FuelPrice[]> {
  return mockFuelPrices
    .filter((p) => p.stationId === stationId)
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

  let results = mockPriceHistory.filter((h) => h.stationId === stationId)
  if (fuelType) results = results.filter((h) => h.fuelType === fuelType)
  if (from) results = results.filter((h) => h.changedAt >= from)
  if (to) results = results.filter((h) => h.changedAt <= to)

  results.sort((a, b) => b.changedAt.localeCompare(a.changedAt))
  return results.slice(0, limit)
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

  const existingIdx = mockFuelPrices.findIndex((p) => p.id === priceDocId)
  const existingPrice = existingIdx !== -1 ? mockFuelPrices[existingIdx].currentPrice : null

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

  if (existingIdx !== -1) {
    mockFuelPrices[existingIdx] = priceData
  } else {
    mockFuelPrices.push(priceData)
  }

  mockPriceHistory.push({
    id: randomUUID(),
    stationId: data.stationId,
    fuelType: data.fuelType,
    oldPrice: existingPrice,
    newPrice: data.price,
    sourceType: data.sourceType,
    reportId: data.confirmedReportId ?? null,
    changedAt: nowIso,
  })

  const badge =
    data.sourceType === 'admin'
      ? 'admin-verified'
      : data.sourceType === 'community'
        ? 'community-verified'
        : 'baseline'

  const stationIdx = mockStations.findIndex((s) => s.id === data.stationId)
  if (stationIdx !== -1) {
    mockStations[stationIdx] = {
      ...mockStations[stationIdx],
      latestPrices: {
        ...mockStations[stationIdx].latestPrices,
        [data.fuelType]: {
          price: data.price,
          sourceType: data.sourceType,
          badge,
          updatedAt: nowIso,
          confirmationCount: data.confirmationCount ?? 0,
        },
      },
      lastUpdatedAt: nowIso,
      updatedAt: nowIso,
    }
  }
}

export async function getBaselinePrices(params: {
  fuelType?: FuelType
  brand?: string
  limit?: number
}): Promise<PriceSnapshot[]> {
  const { fuelType, brand, limit = 50 } = params

  let results = [...mockPriceSnapshots]
  if (fuelType) results = results.filter((s) => s.fuelType === fuelType)
  if (brand) results = results.filter((s) => s.brand === brand)

  results.sort((a, b) => b.scrapedAt.localeCompare(a.scrapedAt))
  return results.slice(0, limit)
}
