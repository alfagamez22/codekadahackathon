export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { readSession } from '@/lib/auth/session'
import { adminDb, defaultSystemConfig } from '@/lib/firebase-admin/firestore'
import { systemConfigSchema } from '@/lib/utils/validators'

export async function POST(request: NextRequest) {
  const session = await readSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = systemConfigSchema.safeParse({
    ...defaultSystemConfig,
    ...body,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid config' }, { status: 400 })
  }

  await adminDb.collection('systemConfig').doc('settings').set(parsed.data, { merge: true })
  revalidateTag('reports', 'max')

  return NextResponse.json({ success: true, config: parsed.data })
}