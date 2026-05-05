import 'server-only'
import { adminDb } from '../firestore'
import type { FuelType } from '@/types/station'

export async function getSystemStats() {
  const [stationSnap, reportSnap, userSnap, pricesSnap] = await Promise.all([
    adminDb.collection('stations').count().get(),
    adminDb.collection('priceHistory').count().get(),
    adminDb.collection('users').count().get(),
    adminDb.collection('fuelPrices').get(),
  ])

  const byFuelType = new Map<string, number[]>()
  for (const doc of pricesSnap.docs) {
    const { fuelType, currentPrice } = doc.data() as { fuelType: FuelType; currentPrice: number }
    if (!byFuelType.has(fuelType)) byFuelType.set(fuelType, [])
    byFuelType.get(fuelType)!.push(currentPrice)
  }

  const averagePrices = Array.from(byFuelType.entries())
    .map(([fuelType, prices]) => ({
      fuelType,
      avgPrice:
        Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100,
    }))
    .sort((a, b) => a.fuelType.localeCompare(b.fuelType))

  return {
    stationCount: stationSnap.data().count,
    reportCount: reportSnap.data().count,
    userCount: userSnap.data().count,
    averagePrices,
  }
}

export async function getTopContributors(limit = 10) {
  const snap = await adminDb
    .collection('users')
    .orderBy('confirmedReportCount', 'desc')
    .orderBy('trustScore', 'desc')
    .limit(limit)
    .get()

  return snap.docs.map((d) => {
    const u = d.data()
    return {
      uid: u.uid as string,
      displayName: u.displayName as string | null,
      confirmedReportCount: u.confirmedReportCount as number,
      trustScore: u.trustScore as number,
    }
  })
}
