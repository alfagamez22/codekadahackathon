export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { readSession } from '@/lib/auth/session'
import {
  isStationSubmissionStatus,
  listStationSubmissions,
} from '@/lib/firebase-admin/queries/station-submissions'

export async function GET(request: NextRequest) {
  const session = await readSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const statusParam = request.nextUrl.searchParams.get('status')
  const status = isStationSubmissionStatus(statusParam) ? statusParam : undefined
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 100) || 100, 200)

  try {
    const submissions = await listStationSubmissions({ status, limit })
    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Station submission query failed:', error)
    return NextResponse.json({ error: 'Failed to load station submissions' }, { status: 500 })
  }
}
