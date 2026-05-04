import type { FuelType, PriceSourceType } from './station'

export interface FuelPrice {
  id: string
  stationId: string
  fuelType: FuelType
  currentPrice: number
  sourceType: PriceSourceType
  confirmedReportId: string | null
  confirmationCount: number
  updatedAt: string
}

export interface PriceHistory {
  id: string
  stationId: string
  fuelType: FuelType
  oldPrice: number | null
  newPrice: number
  sourceType: PriceSourceType
  reportId: string | null
  changedAt: string
}

export interface PriceSnapshot {
  id: string
  sourceName: string
  sourceUrl: string | null
  brand: string | null
  fuelType: FuelType
  locationScope: string | null
  price: number
  scrapedAt: string
}
