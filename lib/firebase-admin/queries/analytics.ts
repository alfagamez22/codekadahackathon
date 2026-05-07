import 'server-only'
import { mockStats, mockUsers } from '@/lib/mock-data'

export type GlobalStats = {
  stationCount: number
  reportCount: number
  userCount: number
  averagePrices: { fuelType: string; avgPrice: number }[]
}

export async function getSystemStats(): Promise<GlobalStats> {
  return {
    stationCount: mockStats.stationCount,
    reportCount: mockStats.reportCount,
    userCount: mockStats.userCount,
    averagePrices: mockStats.averagePrices,
  }
}

export async function incrementReportCount(): Promise<void> {
  mockStats.reportCount += 1
}

export async function incrementUserCount(): Promise<void> {
  mockStats.userCount += 1
}

export async function incrementStationCount(): Promise<void> {
  mockStats.stationCount += 1
}

export async function updatePriceAverage(
  _fuelType: string,
  _newPrice: number,
  _oldPrice?: number,
): Promise<void> {
  // no-op in mock mode — averagePrices are static
}

export async function getTopContributors(limit = 10) {
  return [...mockUsers]
    .sort(
      (a, b) =>
        b.confirmedReportCount - a.confirmedReportCount || b.trustScore - a.trustScore,
    )
    .slice(0, limit)
    .map((u) => ({
      uid: u.uid,
      displayName: u.displayName,
      confirmedReportCount: u.confirmedReportCount,
      trustScore: u.trustScore,
    }))
}
