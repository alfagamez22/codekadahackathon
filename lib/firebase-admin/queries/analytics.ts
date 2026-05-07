import 'server-only'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '../firestore'

// ---------------------------------------------------------------------------
// stats/global — write-time aggregation document
//
// Shape:
//   stationCount:   number  (incremented when a station is created)
//   reportCount:    number  (incremented when a priceReport is submitted)
//   userCount:      number  (incremented when a user is created)
//   averagePrices:  Record<fuelType, { sum: number; count: number }>
//                           (updated when a fuelPrice doc is written)
//
// Reading this doc costs exactly 1 Firestore read regardless of collection size.
// ---------------------------------------------------------------------------

const STATS_DOC = 'stats/global'

export type GlobalStats = {
  stationCount: number
  reportCount: number
  userCount: number
  averagePrices: { fuelType: string; avgPrice: number }[]
}

export async function getSystemStats(): Promise<GlobalStats> {
  const fallback: GlobalStats = { stationCount: 0, reportCount: 0, userCount: 0, averagePrices: [] }
  let snap
  try {
    const db = await getAdminDb()
    snap = await db.doc(STATS_DOC).get()
  } catch (err) {
    const code = (err as { code?: number })?.code
    if (code === 8) {
      // RESOURCE_EXHAUSTED — quota exceeded, return cached defaults gracefully
      console.warn('[analytics] Firestore quota exceeded, returning fallback stats')
      return fallback
    }
    throw err
  }

  if (!snap.exists) {
    return fallback
  }

  const data = snap.data() as {
    stationCount?: number
    reportCount?: number
    userCount?: number
    priceSums?: Record<string, { sum: number; count: number }>
  }

  const averagePrices = Object.entries(data.priceSums ?? {})
    .filter(([, v]) => v.count > 0)
    .map(([fuelType, { sum, count }]) => ({
      fuelType,
      avgPrice: Math.round((sum / count) * 100) / 100,
    }))
    .sort((a, b) => a.fuelType.localeCompare(b.fuelType))

  return {
    stationCount: data.stationCount ?? 0,
    reportCount: data.reportCount ?? 0,
    userCount: data.userCount ?? 0,
    averagePrices,
  }
}

// ---------------------------------------------------------------------------
// Write-time helpers — call these from Server Actions / mutations
// ---------------------------------------------------------------------------

export async function incrementReportCount(): Promise<void> {
  const db = await getAdminDb()
  await db.doc(STATS_DOC).set(
    { reportCount: FieldValue.increment(1) },
    { merge: true },
  )
}

export async function incrementUserCount(): Promise<void> {
  const db = await getAdminDb()
  await db.doc(STATS_DOC).set(
    { userCount: FieldValue.increment(1) },
    { merge: true },
  )
}

export async function incrementStationCount(): Promise<void> {
  const db = await getAdminDb()
  await db.doc(STATS_DOC).set(
    { stationCount: FieldValue.increment(1) },
    { merge: true },
  )
}

/**
 * Update the running price sum/count for a fuel type.
 * Call this when a fuelPrice document is created or updated.
 */
export async function updatePriceAverage(
  fuelType: string,
  newPrice: number,
  oldPrice?: number,
): Promise<void> {
  const db = await getAdminDb()
  const updates: Record<string, unknown> = {
    [`priceSums.${fuelType}.sum`]: FieldValue.increment(newPrice - (oldPrice ?? 0)),
  }
  if (oldPrice === undefined) {
    updates[`priceSums.${fuelType}.count`] = FieldValue.increment(1)
  }
  await db.doc(STATS_DOC).set(updates, { merge: true })
}

export async function getTopContributors(limit = 10) {
  try {
    const db = await getAdminDb()
    const snap = await db
      .collection('users')
      .orderBy('confirmedReportCount', 'desc')
      .limit(limit * 3)
      .get()

    return snap.docs
      .map((d) => {
        const u = d.data()
        const uid = typeof u.uid === 'string' && u.uid.trim().length > 0 ? u.uid : d.id
        return {
          uid,
          displayName: u.displayName as string | null,
          confirmedReportCount: u.confirmedReportCount as number,
          trustScore: u.trustScore as number,
        }
      })
      .sort((a, b) => b.confirmedReportCount - a.confirmedReportCount || b.trustScore - a.trustScore)
      .slice(0, limit)
  } catch (err) {
    const code = (err as { code?: number })?.code
    if (code === 8) {
      console.warn('[analytics] Firestore quota exceeded, returning empty contributors')
      return []
    }
    throw err
  }
}
