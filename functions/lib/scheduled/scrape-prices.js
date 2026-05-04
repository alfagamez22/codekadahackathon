"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledScrape = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const db_1 = __importDefault(require("../utils/db"));
const firestore_admin_1 = require("../utils/firestore-admin");
const doe_ph_1 = require("../scraper/sources/doe-ph");
const petron_1 = require("../scraper/sources/petron");
const shell_1 = require("../scraper/sources/shell");
const seaoil_1 = require("../scraper/sources/seaoil");
const crypto_1 = require("crypto");
const NEXT_APP_URL = process.env.NEXT_APP_URL ?? '';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? '';
exports.scheduledScrape = (0, scheduler_1.onSchedule)('every 6 hours', async () => {
    const scrapers = [doe_ph_1.scrapeDOEPH, petron_1.scrapePetron, shell_1.scrapeShell, seaoil_1.scrapeSeaOil];
    const results = await Promise.allSettled(scrapers.map((fn) => fn())).then((settled) => settled
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value));
    for (const result of results) {
        if (result.prices.length === 0)
            continue;
        const rows = result.prices.map((p) => ({
            id: (0, crypto_1.randomUUID)(),
            source_name: result.sourceName,
            source_url: result.sourceUrl,
            brand: p.brand,
            fuel_type: p.fuelType,
            location_scope: p.locationScope,
            price: p.price,
            scraped_at: result.scrapedAt,
        }));
        await (0, db_1.default) `
      INSERT INTO price_snapshots ${(0, db_1.default)(rows)}
      ON CONFLICT DO NOTHING
    `;
        const batch = firestore_admin_1.db.batch();
        const mirroredAt = new Date().toISOString();
        rows.forEach((row) => {
            batch.set(firestore_admin_1.db.collection('priceSnapshots').doc(row.id), {
                id: row.id,
                sourceName: row.source_name,
                sourceUrl: row.source_url,
                brand: row.brand,
                fuelType: row.fuel_type,
                locationScope: row.location_scope,
                price: row.price,
                scrapedAt: row.scraped_at,
                mirroredAt,
            }, { merge: true });
        });
        await batch.commit();
    }
    // Invalidate cache via webhook
    if (NEXT_APP_URL && WEBHOOK_SECRET) {
        await fetch(`${NEXT_APP_URL}/api/webhooks/scraper`, {
            method: 'POST',
            headers: { 'x-webhook-secret': WEBHOOK_SECRET, 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: 'scheduled-scrape' }),
        });
    }
    console.log(`Scrape complete. Processed ${results.length} sources.`);
});
//# sourceMappingURL=scrape-prices.js.map