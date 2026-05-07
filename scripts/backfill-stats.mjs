/**
 * One-time backfill script: initialises stats/global with accurate counts
 * from the live Firestore collections.
 *
 * Run once after deploying the write-time aggregation changes:
 *   node scripts/backfill-stats.mjs
 *
 * Safe to re-run — it overwrites stats/global with fresh counts.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

async function main() {
  loadEnvFile(path.join(rootDir, '.env'))
  loadEnvFile(path.join(rootDir, '.env.local'))

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing FIREBASE_ADMIN_* env vars')
    process.exitCode = 1
    return
  }

  const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
  const db = getFirestore(app)

  console.log('Counting collections...')

  const [stationSnap, reportSnap, userSnap, pricesSnap] = await Promise.all([
    db.collection('stations').count().get(),
    db.collection('priceHistory').count().get(),
    db.collection('users').count().get(),
    db.collection('fuelPrices').get(),
  ])

  const stationCount = stationSnap.data().count
  const reportCount = reportSnap.data().count
  const userCount = userSnap.data().count

  console.log(`stations: ${stationCount}, reports: ${reportCount}, users: ${userCount}`)
  console.log(`fuelPrices docs read: ${pricesSnap.size}`)

  // Build priceSums from all fuelPrice docs
  const priceSums = {}
  for (const doc of pricesSnap.docs) {
    const { fuelType, currentPrice } = doc.data()
    if (typeof currentPrice !== 'number' || !Number.isFinite(currentPrice)) continue
    if (!priceSums[fuelType]) priceSums[fuelType] = { sum: 0, count: 0 }
    priceSums[fuelType].sum += currentPrice
    priceSums[fuelType].count += 1
  }

  await db.doc('stats/global').set({
    stationCount,
    reportCount,
    userCount,
    priceSums,
    backfilledAt: new Date().toISOString(),
  })

  console.log('stats/global written successfully.')
  for (const [fuelType, { sum, count }] of Object.entries(priceSums)) {
    console.log(`  ${fuelType}: avg ${(sum / count).toFixed(2)} (${count} prices)`)
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exitCode = 1
})
