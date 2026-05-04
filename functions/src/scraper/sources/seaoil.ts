import type { ScraperResult } from '../normalizer'

export async function scrapeSeaOil(): Promise<ScraperResult> {
  console.log('[SeaOil] Scraper stub — integrate Nova Act here')
  return {
    sourceName: 'SeaOil',
    sourceUrl: 'https://www.seaoil.com.ph/prices',
    prices: [],
    scrapedAt: new Date().toISOString(),
  }
}
