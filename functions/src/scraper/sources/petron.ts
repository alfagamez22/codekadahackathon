import type { ScraperResult } from '../normalizer'

export async function scrapePetron(): Promise<ScraperResult> {
  console.log('[Petron] Scraper stub — integrate Nova Act here')
  return {
    sourceName: 'Petron',
    sourceUrl: 'https://www.petron.com/prices',
    prices: [],
    scrapedAt: new Date().toISOString(),
  }
}
