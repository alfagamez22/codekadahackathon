import 'server-only'
import sql from '../index'
import type { Station, StationListItem, FuelType } from '@/types/station'

export async function getStation(id: string): Promise<Station | null> {
  const rows = await sql<Station[]>`
    SELECT
      s.id::text,
      s.name,
      s.brand,
      s.address,
      s.barangay,
      s.city,
      s.province,
      ST_Y(s.location::geometry) AS latitude,
      ST_X(s.location::geometry) AS longitude,
      s.fuel_types AS "fuelTypes",
      s.created_at AS "createdAt",
      s.updated_at AS "updatedAt"
    FROM stations s
    WHERE s.id = ${id}::uuid
  `
  return rows[0] ?? null
}

export async function searchStations(params: {
  province?: string
  city?: string
  brand?: string
  fuelType?: FuelType
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ stations: StationListItem[]; total: number }> {
  const { province, city, brand, fuelType, search, page = 1, pageSize = 20 } = params
  const offset = (page - 1) * pageSize

  const rows = await sql<(StationListItem & { total: string })[]>`
    SELECT
      s.id::text,
      s.name,
      s.brand,
      s.city,
      s.province,
      ST_Y(s.location::geometry) AS latitude,
      ST_X(s.location::geometry) AS longitude,
      MIN(fp.current_price) AS "lowestPrice",
      (SELECT fp2.fuel_type FROM fuel_prices fp2 WHERE fp2.station_id = s.id ORDER BY fp2.current_price ASC LIMIT 1) AS "lowestFuelType",
      COUNT(*) OVER() AS total
    FROM stations s
    LEFT JOIN fuel_prices fp ON fp.station_id = s.id
    WHERE TRUE
      ${province ? sql`AND s.province ILIKE ${'%' + province + '%'}` : sql``}
      ${city ? sql`AND s.city ILIKE ${'%' + city + '%'}` : sql``}
      ${brand ? sql`AND s.brand ILIKE ${'%' + brand + '%'}` : sql``}
      ${fuelType ? sql`AND ${fuelType} = ANY(s.fuel_types)` : sql``}
      ${search ? sql`AND (s.name ILIKE ${'%' + search + '%'} OR s.brand ILIKE ${'%' + search + '%'} OR s.city ILIKE ${'%' + search + '%'})` : sql``}
    GROUP BY s.id
    ORDER BY s.name ASC
    LIMIT ${pageSize} OFFSET ${offset}
  `

  const total = rows[0] ? parseInt(rows[0].total as unknown as string, 10) : 0
  return { stations: rows as unknown as StationListItem[], total }
}

export async function getNearbyStations(params: {
  lat: number
  lng: number
  radiusKm?: number
  fuelType?: FuelType
  limit?: number
}): Promise<StationListItem[]> {
  const { lat, lng, radiusKm = 5, fuelType, limit = 20 } = params

  return sql<StationListItem[]>`
    SELECT
      s.id::text,
      s.name,
      s.brand,
      s.city,
      s.province,
      ST_Y(s.location::geometry) AS latitude,
      ST_X(s.location::geometry) AS longitude,
      MIN(fp.current_price) AS "lowestPrice",
      ST_Distance(s.location::geography, ST_MakePoint(${lng}, ${lat})::geography) / 1000 AS "distanceKm"
    FROM stations s
    LEFT JOIN fuel_prices fp ON fp.station_id = s.id
    WHERE ST_DWithin(
      s.location::geography,
      ST_MakePoint(${lng}, ${lat})::geography,
      ${radiusKm * 1000}
    )
    ${fuelType ? sql`AND ${fuelType} = ANY(s.fuel_types)` : sql``}
    GROUP BY s.id
    ORDER BY "distanceKm" ASC
    LIMIT ${limit}
  `
}

export async function createStation(data: {
  name: string
  brand?: string | null
  address?: string | null
  barangay?: string | null
  city: string
  province: string
  latitude: number
  longitude: number
  fuelTypes: FuelType[]
}): Promise<string> {
  const rows = await sql<{ id: string }[]>`
    INSERT INTO stations (name, brand, address, barangay, city, province, location, fuel_types)
    VALUES (
      ${data.name},
      ${data.brand ?? null},
      ${data.address ?? null},
      ${data.barangay ?? null},
      ${data.city},
      ${data.province},
      ST_MakePoint(${data.longitude}, ${data.latitude})::geometry,
      ${data.fuelTypes}
    )
    RETURNING id::text
  `
  return rows[0].id
}

export async function updateStation(
  id: string,
  data: Partial<{
    name: string
    brand: string | null
    address: string | null
    barangay: string | null
    city: string
    province: string
    latitude: number
    longitude: number
    fuelTypes: FuelType[]
  }>
): Promise<void> {
  await sql`
    UPDATE stations SET
      name = COALESCE(${data.name ?? null}, name),
      brand = COALESCE(${data.brand ?? null}, brand),
      address = COALESCE(${data.address ?? null}, address),
      barangay = COALESCE(${data.barangay ?? null}, barangay),
      city = COALESCE(${data.city ?? null}, city),
      province = COALESCE(${data.province ?? null}, province),
      location = CASE WHEN ${data.latitude ?? null} IS NOT NULL
        THEN ST_MakePoint(${data.longitude ?? null}, ${data.latitude ?? null})::geometry
        ELSE location END,
      fuel_types = COALESCE(${data.fuelTypes ?? null}, fuel_types),
      updated_at = now()
    WHERE id = ${id}::uuid
  `
}

export async function deleteStation(id: string): Promise<void> {
  await sql`DELETE FROM stations WHERE id = ${id}::uuid`
}
