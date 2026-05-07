import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const defaultSystemConfig = {
  minConfirmations: 4,
  flagThreshold: 3,
  reportExpiryHours: 72,
  reportCooldownHours: 6,
  priceTolerancePercent: 2,
  stalePriceDays: 7,
}

const seedTimestamp = new Date().toISOString()

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

function getSeedDocuments() {
  return [
    {
      path: 'systemConfig/settings',
      data: {
        ...defaultSystemConfig,
        seededAt: seedTimestamp,
      },
      merge: true,
    },
    {
      path: '_bootstrap/firestore',
      data: {
        seededAt: seedTimestamp,
        collections: ['systemConfig', 'priceReports', 'stationSubmissions', 'auditLogs', 'pushSubscriptions', 'users', 'stations', 'fuelPrices', 'priceHistory', 'priceSnapshots'],
        note: 'Firestore cannot display empty collections. Marker documents keep the expected collections visible until real data is written.',
      },
      merge: true,
    },
    {
      path: 'priceReports/seed-marker',
      data: {
        _seed: true,
        status: 'seeded',
        createdAt: seedTimestamp,
        updatedAt: seedTimestamp,
        note: 'Safe marker document. Delete after the first real price report is submitted.',
      },
      merge: true,
    },
    {
      path: 'stationSubmissions/seed-marker',
      data: {
        _seed: true,
        status: 'seeded',
        legitCount: 0,
        notLegitCount: 0,
        legitThreshold: 46,
        rejectThreshold: 6,
        createdAt: seedTimestamp,
        updatedAt: seedTimestamp,
        note: 'Safe marker document. Delete after the first real station submission is created.',
      },
      merge: true,
    },
    {
      path: 'auditLogs/seed-marker',
      data: {
        _seed: true,
        action: 'seed_firestore',
        createdAt: seedTimestamp,
        note: 'Safe marker document. Delete after the first real admin action writes an audit log.',
      },
      merge: true,
    },
    {
      path: 'pushSubscriptions/seed-marker',
      data: {
        _seed: true,
        createdAt: seedTimestamp,
        note: 'Safe marker document. Delete after the first real push subscription is stored.',
      },
      merge: true,
    },
    {
      path: 'users/seed-marker',
      data: {
        _seed: true,
        createdAt: seedTimestamp,
        note: 'Safe marker document. Delete after the SQL mirror or first real Firestore user sync runs.',
      },
      merge: true,
    },
    {
      path: 'stations/seed-marker',
      data: {
        _seed: true,
        createdAt: seedTimestamp,
        note: 'Safe marker document. Delete after the SQL mirror or first real Firestore station sync runs.',
      },
      merge: true,
    },
    {
      path: 'fuelPrices/seed-marker',
      data: {
        _seed: true,
        createdAt: seedTimestamp,
        note: 'Safe marker document. Delete after the SQL mirror or first real Firestore fuel price sync runs.',
      },
      merge: true,
    },
    {
      path: 'priceHistory/seed-marker',
      data: {
        _seed: true,
        createdAt: seedTimestamp,
        note: 'Safe marker document. Delete after the SQL mirror or first real Firestore price history sync runs.',
      },
      merge: true,
    },
    {
      path: 'priceSnapshots/seed-marker',
      data: {
        _seed: true,
        createdAt: seedTimestamp,
        note: 'Safe marker document. Delete after the SQL mirror or first real Firestore snapshot sync runs.',
      },
      merge: true,
    },
  ]
}

async function main() {
  loadEnvFile(path.join(rootDir, '.env'))
  loadEnvFile(path.join(rootDir, '.env.local'))

  const isDryRun = process.argv.includes('--dry-run')
  const inspectKey = process.argv.includes('--inspect-key')

  const projectId = requireEnv('FIREBASE_ADMIN_PROJECT_ID')
  const clientEmail = requireEnv('FIREBASE_ADMIN_CLIENT_EMAIL')
  const privateKey = requireEnv('FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n')

  if (inspectKey) {
    const lines = privateKey.split('\n')
    const bodyLines = lines.slice(1, -2)
    console.log(JSON.stringify({
      projectId,
      clientEmail,
      startsWithPemHeader: privateKey.startsWith('-----BEGIN PRIVATE KEY-----'),
      endsWithPemFooter: privateKey.endsWith('-----END PRIVATE KEY-----\n'),
      totalLines: lines.length,
      bodyLineCount: bodyLines.length,
      minBodyLineLength: bodyLines.length ? Math.min(...bodyLines.map((line) => line.length)) : 0,
      maxBodyLineLength: bodyLines.length ? Math.max(...bodyLines.map((line) => line.length)) : 0,
    }, null, 2))
    return
  }

  const seedDocs = getSeedDocuments()

  if (isDryRun) {
    console.log('Dry run. Firestore seed would write these documents:')
    for (const doc of seedDocs) {
      console.log(`- ${doc.path}`)
    }
    return
  }

  const app = getApps()[0] ?? initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  })

  const db = getFirestore(app)
  const batch = db.batch()

  for (const doc of seedDocs) {
    batch.set(db.doc(doc.path), doc.data, { merge: doc.merge })
  }

  await batch.commit()

  console.log('Firestore seed complete.')
  for (const doc of seedDocs) {
    console.log(`- ${doc.path}`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
