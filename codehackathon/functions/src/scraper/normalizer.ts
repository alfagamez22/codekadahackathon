export interface PriceData {
  brand: string
  fuelType: string
  price: number
  locationScope: string
}

export interface ScraperResult {
  sourceName: string
  sourceUrl: string
  prices: PriceData[]
  scrapedAt: string
}
