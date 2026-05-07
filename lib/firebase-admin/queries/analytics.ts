import 'server-only'
import { getAdminDb } from '../firestore'
import type { FuelType } from '@/types/station'

export async function getSystemStats() {
  const db = await getAdminDb()
  const [stationSnap, reportSnap, userSnap, pricesSnap] = await Promise.all([
    db.collection('stations').count().get(),
    db.collection('priceHistory').count().get(),
    db.collection('users').count().get(),
    db.collection('fuelPrices').get(),
  ])

  const byFuelType = new Map<string, number[]>()
  for (const doc of pricesSnap.docs) {
    const { fuelType, currentPrice } = doc.data() as { fuelType: FuelType; currentPrice: number }
    if (typeof currentPrice !== 'number' || !Number.isFinite(currentPrice)) continue
    if (!byFuelType.has(fuelType)) byFuelType.set(fuelType, [])
    byFuelType.get(fuelType)!.push(currentPrice)
  }

  const averagePrices = Array.from(byFuelType.entries())
    .map(([fuelType, prices]) => ({
      fuelType,
      avgPrice:
        Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100,
    }))
    .sort((a, b) => (a.fuelType || '').localeCompare(b.fuelType || ''))

  return {
    stationCount: stationSnap.data().count,
    reportCount: reportSnap.data().count,
    userCount: userSnap.data().count,
    averagePrices,
  }
}

export async function getTopContributors(limit = 10) {
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
}
