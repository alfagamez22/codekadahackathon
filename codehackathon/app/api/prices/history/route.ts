export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getPriceHistory } from '@/lib/db/queries/prices'
import type { FuelType } from '@/types/station'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const stationId = searchParams.get('stationId')
  const fuelType = searchParams.get('fuelType') as FuelType | undefined
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined

  if (!stationId) {
    return NextResponse.json({ error: 'stationId is required' }, { status: 400 })
  }

  try {
    const history = await getPriceHistory({ stationId, fuelType, from, to })
    return NextResponse.json({ history })
  } catch (error) {
    console.error('Price history failed:', error)
    return NextResponse.json({ error: 'Failed to fetch price history' }, { status: 500 })
  }
}
