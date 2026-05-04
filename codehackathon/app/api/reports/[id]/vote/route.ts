export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { readSession } from '@/lib/auth/session'
import { castVoteAction } from '@/app/_actions/validations'
import type { VoteType } from '@/types/report'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const session = await readSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const result = await castVoteAction({ reportId: id, voteType: body.voteType as VoteType })

  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ success: true })
}
