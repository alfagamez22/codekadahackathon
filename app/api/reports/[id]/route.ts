export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { mockPriceReports } from '@/lib/mock-data'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const report = mockPriceReports.find((r) => r.id === id)
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ report })
}
