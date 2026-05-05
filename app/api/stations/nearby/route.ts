export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getNearbyStations } from '@/lib/firebase-admin/queries/stations'
import { parseCoordinates } from '@/lib/utils/geo'
import type { FuelType } from '@/types/station'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const coords = parseCoordinates(searchParams.get('lat'), searchParams.get('lng'))

  if (!coords) {
    return NextResponse.json({ error: 'Valid lat and lng are required' }, { status: 400 })
  }

  const radiusKm = parseFloat(searchParams.get('radius') ?? '5')
  const fuelType = searchParams.get('fuelType') as FuelType | undefined
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)

  try {
    const stations = await getNearbyStations({ lat: coords.lat, lng: coords.lng, radiusKm, fuelType, limit })
    return NextResponse.json({ stations })
  } catch (error) {
    console.error('Nearby stations query failed:', error)
    return NextResponse.json({ error: 'Failed to fetch nearby stations' }, { status: 500 })
  }
}
