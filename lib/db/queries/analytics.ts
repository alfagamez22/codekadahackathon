import 'server-only'
import sql from '../index'

export async function getSystemStats() {
  const [stationCount, reportCount, userCount, recentPrices] = await Promise.all([
    sql<{ count: string }[]>`SELECT COUNT(*) AS count FROM stations`,
    sql<{ count: string }[]>`SELECT COUNT(*) AS count FROM price_history`,
    sql<{ count: string }[]>`SELECT COUNT(*) AS count FROM users`,
    sql<{ fuel_type: string; avg_price: string }[]>`
      SELECT fuel_type, ROUND(AVG(current_price), 2)::text AS avg_price
      FROM fuel_prices
      GROUP BY fuel_type
      ORDER BY fuel_type
    `,
  ])

  return {
    stationCount: parseInt(stationCount[0]?.count ?? '0', 10),
    reportCount: parseInt(reportCount[0]?.count ?? '0', 10),
    userCount: parseInt(userCount[0]?.count ?? '0', 10),
    averagePrices: recentPrices.map((r) => ({
      fuelType: r.fuel_type,
      avgPrice: parseFloat(r.avg_price),
    })),
  }
}

export async function getTopContributors(limit = 10) {
  return sql<{
    uid: string
    displayName: string | null
    confirmedReportCount: number
    trustScore: number
  }[]>`
    SELECT
      id AS uid,
      display_name AS "displayName",
      confirmed_report_count AS "confirmedReportCount",
      trust_score AS "trustScore"
    FROM users
    ORDER BY confirmed_report_count DESC, trust_score DESC
    LIMIT ${limit}
  `
}
