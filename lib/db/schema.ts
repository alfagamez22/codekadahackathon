// Runtime TypeScript types derived from SQL schema (for IDE support alongside raw sql queries)
import type { FuelType, PriceSourceType } from '@/types/station'
import type { UserRole } from '@/types/auth'

export interface DbStation {
  id: string
  name: string
  brand: string | null
  address: string | null
  barangay: string | null
  city: string
  province: string
  fuelTypes: FuelType[]
  createdAt: string
  updatedAt: string
}

export interface DbFuelPrice {
  id: string
  stationId: string
  fuelType: FuelType
  currentPrice: number
  sourceType: PriceSourceType
  confirmedReportId: string | null
  confirmationCount: number
  updatedAt: string
}

export interface DbPriceHistory {
  id: string
  stationId: string
  fuelType: FuelType
  oldPrice: number | null
  newPrice: number
  sourceType: PriceSourceType
  reportId: string | null
  changedAt: string
}

export interface DbUser {
  id: string
  displayName: string | null
  email: string | null
  photoUrl: string | null
  role: UserRole
  trustScore: number
  reportCount: number
  confirmedReportCount: number
  createdAt: string
  updatedAt: string
}

export interface DbPriceSnapshot {
  id: string
  sourceName: string
  sourceUrl: string | null
  brand: string | null
  fuelType: FuelType
  locationScope: string | null
  price: number
  scrapedAt: string
}

export interface DbAuditLog {
  id: string
  adminId: string
  action: string
  targetType: string | null
  targetId: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  createdAt: string
}
