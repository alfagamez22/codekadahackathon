export interface CommunityPriceEntry {
  price: number
  note: string
  timestamp: string
  count: number
}

export type CommunityPricesMap = Record<string, Record<string, CommunityPriceEntry>>

export interface CommunityPricesResponse {
  communityPrices: CommunityPricesMap
}

export interface GasPriceItem {
  stationId: string
  fuelType: string
  price: number
  note: string
  timestamp: string
  reportCount: number
}
