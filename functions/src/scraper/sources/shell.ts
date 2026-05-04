import type { ScraperResult } from '../normalizer'

export async function scrapeShell(): Promise<ScraperResult> {
  console.log('[Shell] Scraper stub — integrate Nova Act here')
  return {
    sourceName: 'Shell',
    sourceUrl: 'https://www.shell.com.ph/prices',
    prices: [],
    scrapedAt: new Date().toISOString(),
  }
}
