export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { searchStations } from '@/lib/db/queries/stations'
import type { FuelType } from '@/types/station'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const province = searchParams.get('province') ?? undefined
  const city = searchParams.get('city') ?? undefined
  const brand = searchParams.get('brand') ?? undefined
  const fuelType = searchParams.get('fuelType') as FuelType | undefined
  const search = searchParams.get('search') ?? undefined
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') ?? '20', 10), 50)

  try {
    const result = await searchStations({ province, city, brand, fuelType, search, page, pageSize })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Station search failed:', error)
    return NextResponse.json({ error: 'Failed to fetch stations' }, { status: 500 })
  }
}
