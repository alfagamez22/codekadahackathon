import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const DEFAULT_GASWATCHPH_DATA_URL = 'https://gaswatchph.com/js/data.js?v=20260505a'

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

// Minimal GasWatch parsing logic based on lib/gaswatchph.ts
export function extractJsonArray(source, marker = 'const GAS_STATIONS') {
  const markerIndex = source.indexOf(marker)
  if (markerIndex === -1) throw new Error('GAS_STATIONS marker not found in payload.')

  const arrayStart = source.indexOf('[', markerIndex)
  if (arrayStart === -1) throw new Error('GAS_STATIONS array start not found in payload.')

  let depth = 0
  let inString = false
  let quoteChar = ''

  for (let i = arrayStart; i < source.length; i += 1) {
    const char = source[i]

    if (inString) {
      if (char === '\\') { i += 1; continue }
      if (char === quoteChar) { inString = false }
      continue
    }

    if (char === '"' || char === "'") {
      inString = true
      quoteChar = char
      continue
    }

    if (char === '[') { depth += 1; continue }
    if (char === ']') {
      depth -= 1
      if (depth === 0) {
        return source.slice(arrayStart, i + 1)
      }
    }
  }

  throw new Error('GAS_STATIONS array could not be parsed from payload.')
}

async function fetchGaswatchStations() {
  const url = process.env.GASWATCHPH_DATA_URL ?? DEFAULT_GASWATCHPH_DATA_URL
  console.log(`Fetching from ${url}...`)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`GasWatchPH request failed (${response.status})`)
  
  const text = await response.text()
  const arrayString = extractJsonArray(text)
  return JSON.parse(arrayString)
}

async function main() {
  loadEnvFile(path.join(rootDir, '.env'))
  loadEnvFile(path.join(rootDir, '.env.local'))

  const isDryRun = process.argv.includes('--dry-run')

  const app = getApps()[0] ?? initializeApp({
    credential: cert({
      projectId: requireEnv('FIREBASE_ADMIN_PROJECT_ID'),
      clientEmail: requireEnv('FIREBASE_ADMIN_CLIENT_EMAIL'),
      privateKey: requireEnv('FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n'),
    }),
  })
  
  const db = getFirestore(app)

  const gwStations = await fetchGaswatchStations()
  console.log(`Fetched ${gwStations.length} stations from network.`)

  const stationsRef = db.collection('stations')
  const existingSnap = await stationsRef.where('dataSource', '==', 'gaswatchph').get()
  
  const existingByExtId = new Map()
  for (const doc of existingSnap.docs) {
    const data = doc.data()
    if (data.externalId) {
      existingByExtId.set(data.externalId, doc)
    }
  }

  console.log(`Found ${existingByExtId.size} existing gaswatchph stations in Firestore.`)

  let newCount = 0
  let updateCount = 0
  const nowIso = new Date().toISOString()
  
  // Chunking for batch writes
  const CHUNK_SIZE = 400
  for (let i = 0; i < gwStations.length; i += CHUNK_SIZE) {
    const chunk = gwStations.slice(i, i + CHUNK_SIZE)
    const batch = db.batch()

    for (const gw of chunk) {
      const extId = `gw_${gw.id}`
      const existingDoc = existingByExtId.get(extId)
      
      const docRef = existingDoc ? existingDoc.ref : stationsRef.doc()

      const stationData = {
        name: gw.name,
        brand: gw.brand || null,
        city: gw.area || 'Unknown',
        province: 'Metro Manila', // Default for Gaswatch
        latitude: gw.lat,
        longitude: gw.lng,
        dataSource: 'gaswatchph',
        externalId: extId,
        updatedAt: nowIso,
      }

      if (!existingDoc) {
        stationData.id = docRef.id
        stationData.createdAt = nowIso
        stationData.fuelTypes = []
        stationData.latestPrices = {}
        stationData.address = null
        stationData.barangay = null
        stationData.lastUpdatedAt = null
        if (!isDryRun) batch.set(docRef, stationData)
        newCount++
      } else {
        if (!isDryRun) batch.update(docRef, stationData)
        updateCount++
      }
    }

    if (!isDryRun) {
      await batch.commit()
    }
  }

  console.log(`${isDryRun ? '[DRY RUN] Would process' : 'Processed'}: ${newCount} new, ${updateCount} updated stations.`)
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
