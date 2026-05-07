export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { upsertConfirmedPrice } from '@/lib/firebase-admin/queries/prices'
import { updateTag } from 'next/cache'
import type { FuelType } from '@/types/station'

export async function POST(request: NextRequest) {
  const webhookSecret = request.headers.get('x-webhook-secret')
  if (webhookSecret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { stationId, fuelType, price, sourceType, confirmedReportId } = body

    await upsertConfirmedPrice({
      stationId,
      fuelType: fuelType as FuelType,
      price: parseFloat(price),
      sourceType: sourceType ?? 'community',
      confirmedReportId,
    })

    updateTag('prices')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook failed:', error)
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 })
  }
}
