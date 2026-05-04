import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue

    const [, key, rawValue] = match
    let value = rawValue.trim()
    const quote = value[0]

    if ((quote === '"' || quote === "'") && !hasClosingQuote(value, quote)) {
      while (index + 1 < lines.length) {
        index += 1
        value += `\n${lines[index]}`

        if (hasClosingQuote(lines[index].trimEnd(), quote)) {
          break
        }
      }
    }

    if (value.endsWith(',')) {
      value = value.slice(0, -1).trim()
    }

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (!value) continue
    process.env[key] = value
  }
}

function hasClosingQuote(value, quote) {
  const trimmed = value.trimEnd()
  return trimmed.endsWith(quote) || trimmed.endsWith(`${quote},`)
}

function requireEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function withMirrorMetadata(data) {
  return {
    ...data,
    mirroredAt: new Date().toISOString(),
  }
}

async function writeCollection(db, collectionName, docs, dryRun) {
  console.log(`${collectionName}: ${docs.length}`)
  if (dryRun || docs.length === 0) return

  for (let index = 0; index < docs.length; index += 400) {
    const chunk = docs.slice(index, index + 400)
    const batch = db.batch()
    chunk.forEach((doc) => {
      batch.set(db.collection(collectionName).doc(doc.id ?? doc.uid), withMirrorMetadata(doc), { merge: true })
    })
    await batch.commit()
  }
}

async function main() {
  loadEnvFile(path.join(rootDir, '.env'))
  loadEnvFile(path.join(rootDir, '.env.local'))

  const dryRun = process.argv.includes('--dry-run')

  const sql = postgres(requireEnv('POSTGRES_URL'), {
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 1,
  })

  const app = getApps()[0] ?? initializeApp({
    credential: cert({
      projectId: requireEnv('FIREBASE_ADMIN_PROJECT_ID'),
      clientEmail: requireEnv('FIREBASE_ADMIN_CLIENT_EMAIL'),
      privateKey: requireEnv('FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n'),
    }),
  })
  const db = getFirestore(app)

  try {
    const users = await sql`
      SELECT
        id AS uid,
        display_name AS "displayName",
        email,
        photo_url AS "photoURL",
        role,
        trust_score AS "trustScore",
        report_count AS "reportCount",
        confirmed_report_count AS "confirmedReportCount",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM users
      ORDER BY created_at ASC
    `

    const stations = await sql`
      SELECT
        id::text AS id,
        name,
        brand,
        address,
        barangay,
        city,
        province,
        ST_Y(location::geometry) AS latitude,
        ST_X(location::geometry) AS longitude,
        fuel_types AS "fuelTypes",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM stations
      ORDER BY created_at ASC
    `

    const fuelPrices = await sql`
      SELECT
        id::text AS id,
        station_id::text AS "stationId",
        fuel_type AS "fuelType",
        current_price::float AS "currentPrice",
        source_type AS "sourceType",
        confirmed_report_id AS "confirmedReportId",
        confirmation_count AS "confirmationCount",
        updated_at AS "updatedAt"
      FROM fuel_prices
      ORDER BY updated_at ASC
    `

    const priceHistory = await sql`
      SELECT
        id::text AS id,
        station_id::text AS "stationId",
        fuel_type AS "fuelType",
        old_price::float AS "oldPrice",
        new_price::float AS "newPrice",
        source_type AS "sourceType",
        report_id AS "reportId",
        changed_at AS "changedAt"
      FROM price_history
      ORDER BY changed_at ASC
    `

    const priceSnapshots = await sql`
      SELECT
        id::text AS id,
        source_name AS "sourceName",
        source_url AS "sourceUrl",
        brand,
        fuel_type AS "fuelType",
        location_scope AS "locationScope",
        price::float AS price,
        scraped_at AS "scrapedAt"
      FROM price_snapshots
      ORDER BY scraped_at ASC
    `

    console.log(dryRun ? 'Dry run. SQL rows ready to mirror:' : 'Mirroring SQL rows to Firestore:')
    await writeCollection(db, 'users', users, dryRun)
    await writeCollection(db, 'stations', stations, dryRun)
    await writeCollection(db, 'fuelPrices', fuelPrices, dryRun)
    await writeCollection(db, 'priceHistory', priceHistory, dryRun)
    await writeCollection(db, 'priceSnapshots', priceSnapshots, dryRun)

    if (!dryRun) {
      await db.collection('_bootstrap').doc('sqlMirror').set({
        users: users.length,
        stations: stations.length,
        fuelPrices: fuelPrices.length,
        priceHistory: priceHistory.length,
        priceSnapshots: priceSnapshots.length,
        syncedAt: new Date().toISOString(),
      }, { merge: true })
    }
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes('ECONNREFUSED') || message.includes('ETIMEDOUT')) {
    console.error('Unable to connect to PostgreSQL. Set POSTGRES_URL to your real database or start the local PostgreSQL server, then rerun npm run firebase:sync-sql -- --dry-run.')
  } else {
    console.error(message)
  }

  process.exitCode = 1
})