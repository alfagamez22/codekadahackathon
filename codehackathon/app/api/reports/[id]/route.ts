export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin/firestore'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const snap = await adminDb.collection('priceReports').doc(id).get()
  if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ report: { id: snap.id, ...snap.data() } })
}
