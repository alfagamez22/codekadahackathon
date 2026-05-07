export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin/firestore'
import type { FuelType } from '@/types/station'

type CommunityPriceOverride = {
  stationId: string
  fuelType: FuelType
  price: number
  confirmationCount: number
  updatedAt: string
}

export async function GET() {
  try {
    const db = await getAdminDb()
    const snap = await db
      .collection('fuelPrices')
      .where('sourceType', '==', 'community')
      .limit(1000)
      .get()

    const prices = snap.docs
      .map((doc) => doc.data())
      .filter((price) => typeof price.stationId === 'string' && price.stationId.startsWith('gaswatch-'))
      .map((price) => ({
        stationId: price.stationId as string,
        fuelType: price.fuelType as FuelType,
        price: Number(price.currentPrice),
        confirmationCount: Number(price.confirmationCount ?? 0),
        updatedAt: String(price.updatedAt ?? ''),
      }))
      .filter((price): price is CommunityPriceOverride => Number.isFinite(price.price))

    return NextResponse.json({ prices })
  } catch (error) {
    console.error('Community overrides failed:', error)
    return NextResponse.json({ error: 'Failed to load community price overrides' }, { status: 500 })
  }
}

