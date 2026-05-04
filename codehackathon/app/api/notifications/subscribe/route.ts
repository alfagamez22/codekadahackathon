export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { readSession } from '@/lib/auth/session'
import { subscribeToPushAction, unsubscribeFromPushAction } from '@/app/_actions/notifications'

export async function POST(request: NextRequest) {
  const session = await readSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await request.json()
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const result = await subscribeToPushAction(token)
  return NextResponse.json(result)
}

export async function DELETE() {
  const session = await readSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await unsubscribeFromPushAction()
  return NextResponse.json(result)
}
