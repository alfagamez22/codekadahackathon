export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { mockFuelPrices } from '@/lib/mock-data'
import type { FuelType } from '@/types/station'

type CommunityPriceOverride = {
  stationId: string
  fuelType: FuelType
  price: number
  confirmationCount: number
  updatedAt: string
}

export async function GET() {
  const prices: CommunityPriceOverride[] = mockFuelPrices
    .filter(
      (p) =>
        p.sourceType === 'community' &&
        typeof p.stationId === 'string' &&
        p.stationId.startsWith('gaswatch-'),
    )
    .map((p) => ({
      stationId: p.stationId,
      fuelType: p.fuelType,
      price: p.currentPrice,
      confirmationCount: p.confirmationCount,
      updatedAt: p.updatedAt,
    }))

  return NextResponse.json({ prices })
}
