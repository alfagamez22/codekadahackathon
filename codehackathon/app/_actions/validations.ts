'use server'

import { requireAuth } from '@/lib/auth/guards'
import { adminDb, getSystemConfig } from '@/lib/firebase-admin/firestore'
import { voteSchema } from '@/lib/utils/validators'
import { upsertConfirmedPrice } from '@/lib/db/queries/prices'
import { incrementUserReportCount } from '@/lib/db/queries/users'
import { FieldValue } from 'firebase-admin/firestore'
import type { FuelType } from '@/types/station'
import type { VoteType } from '@/types/report'

export async function castVoteAction(input: { reportId: string; voteType: VoteType }) {
  const session = await requireAuth()
  const parsed = voteSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { reportId, voteType } = parsed.data
  const userId = session.uid

  try {
    const config = await getSystemConfig()
    const reportRef = adminDb.collection('priceReports').doc(reportId)
    const voteRef = reportRef.collection('votes').doc(userId)

    await adminDb.runTransaction(async (tx) => {
      const reportSnap = await tx.get(reportRef)
      if (!reportSnap.exists) throw new Error('Report not found')

      const report = reportSnap.data()!
      if (report.reporterId === userId) throw new Error('Cannot vote on your own report')
      if (report.status !== 'pending') throw new Error('Report is no longer pending')

      const existingVote = await tx.get(voteRef)
      if (existingVote.exists) throw new Error('Already voted on this report')

      tx.set(voteRef, { userId, voteType, votedAt: new Date().toISOString() })

      const update: Record<string, unknown> = { updatedAt: new Date().toISOString() }

      if (voteType === 'confirm') {
        update.confirmCount = FieldValue.increment(1)
        const newCount = (report.confirmCount ?? 0) + 1
        if (newCount >= config.minConfirmations) {
          update.status = 'confirmed'
          update.confirmationCount = newCount
        }
      } else if (voteType === 'reject') {
        update.rejectCount = FieldValue.increment(1)
        if ((report.rejectCount ?? 0) + 1 >= config.minConfirmations) {
          update.status = 'rejected'
        }
      } else if (voteType === 'flag') {
        update.flagCount = FieldValue.increment(1)
        if ((report.flagCount ?? 0) + 1 >= config.flagThreshold) {
          update.status = 'flagged'
        }
      }

      tx.update(reportRef, update)
    })

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Vote failed'
    return { error: message }
  }
}
