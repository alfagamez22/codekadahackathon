import 'server-only'

// Dev mode mock data
export async function getSystemStats() {
  return {
    stationCount: 42,
    reportCount: 156,
    userCount: 89,
    averagePrices: [
      { fuelType: 'Diesel', avgPrice: 55.50 },
      { fuelType: 'Premium Gasoline', avgPrice: 62.75 },
      { fuelType: 'Regular Gasoline', avgPrice: 59.25 },
    ],
  }
}

export async function getTopContributors(limit = 10) {
  return [
    { uid: 'user-1', displayName: 'John Doe', confirmedReportCount: 45, trustScore: 120 },
    { uid: 'user-2', displayName: 'Jane Smith', confirmedReportCount: 38, trustScore: 104 },
    { uid: 'user-3', displayName: 'Mike Johnson', confirmedReportCount: 32, trustScore: 92 },
    { uid: 'user-4', displayName: 'Sarah Williams', confirmedReportCount: 28, trustScore: 80 },
    { uid: 'user-5', displayName: 'Chris Brown', confirmedReportCount: 24, trustScore: 72 },
  ].slice(0, limit)
}
