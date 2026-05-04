export type FuelType = 'gasoline' | 'premium' | 'diesel' | 'kerosene' | 'lpg'

export type PriceSourceType = 'scraped' | 'community' | 'admin'

export type PriceBadge =
  | 'admin-verified'
  | 'community-verified'
  | 'pending-update'
  | 'baseline'
  | 'stale'

export interface Station {
  id: string
  name: string
  brand: string | null
  address: string | null
  barangay: string | null
  city: string
  province: string
  latitude: number
  longitude: number
  fuelTypes: FuelType[]
  latestPrices: Partial<Record<FuelType, StationPrice>>
  lastUpdatedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface StationPrice {
  price: number
  sourceType: PriceSourceType
  badge: PriceBadge
  updatedAt: string
  confirmationCount: number
}

export interface StationListItem {
  id: string
  name: string
  brand: string | null
  city: string
  province: string
  latitude: number
  longitude: number
  lowestPrice: number | null
  lowestFuelType: FuelType | null
  distanceKm?: number
}
