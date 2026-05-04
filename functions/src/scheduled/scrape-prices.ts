import { onSchedule } from 'firebase-functions/v2/scheduler'
import sql from '../utils/db'
import { db } from '../utils/firestore-admin'
import { scrapeDOEPH } from '../scraper/sources/doe-ph'
import { scrapePetron } from '../scraper/sources/petron'
import { scrapeShell } from '../scraper/sources/shell'
import { scrapeSeaOil } from '../scraper/sources/seaoil'
import type { ScraperResult } from '../scraper/normalizer'
import { randomUUID } from 'crypto'

const NEXT_APP_URL = process.env.NEXT_APP_URL ?? ''
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? ''

export const scheduledScrape = onSchedule('every 6 hours', async () => {
  const scrapers = [scrapeDOEPH, scrapePetron, scrapeShell, scrapeSeaOil]
  const results: ScraperResult[] = await Promise.allSettled(scrapers.map((fn) => fn())).then(
    (settled) =>
      settled
        .filter((r): r is PromiseFulfilledResult<ScraperResult> => r.status === 'fulfilled')
        .map((r) => r.value)
  )

  for (const result of results) {
    if (result.prices.length === 0) continue

    const rows = result.prices.map((p) => ({
      id: randomUUID(),
      source_name: result.sourceName,
      source_url: result.sourceUrl,
      brand: p.brand,
      fuel_type: p.fuelType,
      location_scope: p.locationScope,
      price: p.price,
      scraped_at: result.scrapedAt,
    }))

    await sql`
      INSERT INTO price_snapshots ${sql(rows)}
      ON CONFLICT DO NOTHING
    `

    const batch = db.batch()
    const mirroredAt = new Date().toISOString()
    rows.forEach((row) => {
      batch.set(db.collection('priceSnapshots').doc(row.id), {
        id: row.id,
        sourceName: row.source_name,
        sourceUrl: row.source_url,
        brand: row.brand,
        fuelType: row.fuel_type,
        locationScope: row.location_scope,
        price: row.price,
        scrapedAt: row.scraped_at,
        mirroredAt,
      }, { merge: true })
    })
    await batch.commit()
  }

  // Invalidate cache via webhook
  if (NEXT_APP_URL && WEBHOOK_SECRET) {
    await fetch(`${NEXT_APP_URL}/api/webhooks/scraper`, {
      method: 'POST',
      headers: { 'x-webhook-secret': WEBHOOK_SECRET, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'scheduled-scrape' }),
    })
  }

  console.log(`Scrape complete. Processed ${results.length} sources.`)
})
