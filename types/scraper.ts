import type { FuelType } from './station'

export type ScraperSource = 'doe-ph' | 'petron' | 'shell' | 'seaoil' | 'caltex'

export interface ScraperResult {
  sourceName: ScraperSource
  sourceUrl: string
  brand: string | null
  fuelType: FuelType
  locationScope: string | null
  price: number
  scrapedAt: string
}

export interface ScraperJob {
  id: string
  source: ScraperSource
  status: 'running' | 'success' | 'failed'
  recordsScraped: number
  error: string | null
  startedAt: string
  completedAt: string | null
}
