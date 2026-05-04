export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getStation } from '@/lib/db/queries/stations'
import { getCurrentPrices, getBaselinePrices } from '@/lib/db/queries/prices'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    const [station, prices] = await Promise.all([
      getStation(id),
      getCurrentPrices(id),
    ])

    if (!station) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 })
    }

    // Attach prices to station
    const latestPrices: Record<string, unknown> = {}
    for (const price of prices) {
      latestPrices[price.fuelType] = price
    }

    return NextResponse.json({ station: { ...station, latestPrices } })
  } catch (error) {
    console.error('Station fetch failed:', error)
    return NextResponse.json({ error: 'Failed to fetch station' }, { status: 500 })
  }
}
