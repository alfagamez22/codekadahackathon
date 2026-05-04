import 'server-only'
import sql from '../index'
import { mirrorFuelPriceToFirestore, mirrorPriceHistoryToFirestore } from '@/lib/firebase-admin/sql-mirror'
import type { FuelPrice, PriceHistory, PriceSnapshot } from '@/types/price'
import type { FuelType, PriceSourceType } from '@/types/station'

export async function getCurrentPrices(stationId: string): Promise<FuelPrice[]> {
  return sql<FuelPrice[]>`
    SELECT
      id::text,
      station_id::text AS "stationId",
      fuel_type AS "fuelType",
      current_price::float AS "currentPrice",
      source_type AS "sourceType",
      confirmed_report_id AS "confirmedReportId",
      confirmation_count AS "confirmationCount",
      updated_at AS "updatedAt"
    FROM fuel_prices
    WHERE station_id = ${stationId}::uuid
    ORDER BY fuel_type
  `
}

export async function getPriceHistory(params: {
  stationId: string
  fuelType?: FuelType
  from?: string
  to?: string
  limit?: number
}): Promise<PriceHistory[]> {
  const { stationId, fuelType, from, to, limit = 100 } = params

  return sql<PriceHistory[]>`
    SELECT
      id::text,
      station_id::text AS "stationId",
      fuel_type AS "fuelType",
      old_price::float AS "oldPrice",
      new_price::float AS "newPrice",
      source_type AS "sourceType",
      report_id AS "reportId",
      changed_at AS "changedAt"
    FROM price_history
    WHERE station_id = ${stationId}::uuid
      ${fuelType ? sql`AND fuel_type = ${fuelType}` : sql``}
      ${from ? sql`AND changed_at >= ${from}::timestamptz` : sql``}
      ${to ? sql`AND changed_at <= ${to}::timestamptz` : sql``}
    ORDER BY changed_at DESC
    LIMIT ${limit}
  `
}

export async function upsertConfirmedPrice(data: {
  stationId: string
  fuelType: FuelType
  price: number
  sourceType: PriceSourceType
  confirmedReportId?: string
  confirmationCount?: number
}): Promise<void> {
  const existing = await sql<{ currentPrice: number }[]>`
    SELECT current_price::float AS "currentPrice"
    FROM fuel_prices
    WHERE station_id = ${data.stationId}::uuid AND fuel_type = ${data.fuelType}
  `

  await sql`
    INSERT INTO fuel_prices (station_id, fuel_type, current_price, source_type, confirmed_report_id, confirmation_count)
    VALUES (
      ${data.stationId}::uuid,
      ${data.fuelType},
      ${data.price},
      ${data.sourceType},
      ${data.confirmedReportId ?? null},
      ${data.confirmationCount ?? 0}
    )
    ON CONFLICT (station_id, fuel_type) DO UPDATE SET
      current_price = EXCLUDED.current_price,
      source_type = EXCLUDED.source_type,
      confirmed_report_id = EXCLUDED.confirmed_report_id,
      confirmation_count = EXCLUDED.confirmation_count,
      updated_at = now()
  `

  await sql`
    INSERT INTO price_history (station_id, fuel_type, old_price, new_price, source_type, report_id)
    VALUES (
      ${data.stationId}::uuid,
      ${data.fuelType},
      ${existing[0]?.currentPrice ?? null},
      ${data.price},
      ${data.sourceType},
      ${data.confirmedReportId ?? null}
    )
  `

  const currentPriceRows = await sql<FuelPrice[]>`
    SELECT
      id::text,
      station_id::text AS "stationId",
      fuel_type AS "fuelType",
      current_price::float AS "currentPrice",
      source_type AS "sourceType",
      confirmed_report_id AS "confirmedReportId",
      confirmation_count AS "confirmationCount",
      updated_at AS "updatedAt"
    FROM fuel_prices
    WHERE station_id = ${data.stationId}::uuid AND fuel_type = ${data.fuelType}
  `

  const latestHistoryRows = await sql<PriceHistory[]>`
    SELECT
      id::text,
      station_id::text AS "stationId",
      fuel_type AS "fuelType",
      old_price::float AS "oldPrice",
      new_price::float AS "newPrice",
      source_type AS "sourceType",
      report_id AS "reportId",
      changed_at AS "changedAt"
    FROM price_history
    WHERE station_id = ${data.stationId}::uuid AND fuel_type = ${data.fuelType}
    ORDER BY changed_at DESC, id DESC
    LIMIT 1
  `

  if (currentPriceRows[0]) {
    await mirrorFuelPriceToFirestore(currentPriceRows[0])
  }

  if (latestHistoryRows[0]) {
    await mirrorPriceHistoryToFirestore(latestHistoryRows[0])
  }
}

export async function getBaselinePrices(params: {
  fuelType?: FuelType
  brand?: string
  limit?: number
}): Promise<PriceSnapshot[]> {
  const { fuelType, brand, limit = 50 } = params

  return sql<PriceSnapshot[]>`
    SELECT
      id::text,
      source_name AS "sourceName",
      source_url AS "sourceUrl",
      brand,
      fuel_type AS "fuelType",
      location_scope AS "locationScope",
      price::float AS price,
      scraped_at AS "scrapedAt"
    FROM price_snapshots
    WHERE TRUE
      ${fuelType ? sql`AND fuel_type = ${fuelType}` : sql``}
      ${brand ? sql`AND brand ILIKE ${'%' + brand + '%'}` : sql``}
    ORDER BY scraped_at DESC
    LIMIT ${limit}
  `
}
