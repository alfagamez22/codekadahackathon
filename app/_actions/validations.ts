'use server'

import { requireAuth } from '@/lib/auth/guards'
import { getAdminDb, getSystemConfig } from '@/lib/firebase-admin/firestore'
import { upsertConfirmedPrice } from '@/lib/firebase-admin/queries/prices'
import { voteSchema } from '@/lib/utils/validators'
import { DocumentSnapshot, FieldValue, Transaction } from 'firebase-admin/firestore'
import type { VoteType } from '@/types/report'
import type { FuelType } from '@/types/station'

type ConfirmedPriceUpdate = {
  stationId: string
  fuelType: FuelType
  price: number
  reportId: string
  confirmationCount: number
  reporterId: string | null
}

export async function castVoteAction(input: { reportId: string; voteType: VoteType }) {
  const session = await requireAuth()
  const parsed = voteSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { reportId, voteType } = parsed.data
  const userId = session.uid

  try {
    const config = await getSystemConfig()
    const db = await getAdminDb()
    const reportRef = db.collection('priceReports').doc(reportId)
    const voteRef = reportRef.collection('votes').doc(userId)

    const confirmedPrice = await db.runTransaction(async (tx: Transaction): Promise<ConfirmedPriceUpdate | null> => {
      const reportSnap = (await tx.get(reportRef)) as unknown as DocumentSnapshot
      if (!reportSnap.exists) {
        throw new Error('Report not found')
      }

      const report = reportSnap.data() as Record<string, unknown>
      const nowIso = new Date().toISOString()
      const expiresAtMs = Date.parse(String(report.expiresAt ?? ''))

      if (report.reporterId === userId) {
        throw new Error('Cannot vote on your own report')
      }

      if (report.status !== 'pending') {
        throw new Error('Report is no longer pending')
      }

      if (Number.isFinite(expiresAtMs) && expiresAtMs <= Date.now()) {
        tx.update(reportRef, { status: 'expired', updatedAt: nowIso })
        throw new Error('Report has expired')
      }

      const existingVote = (await tx.get(voteRef)) as unknown as DocumentSnapshot
      if (existingVote.exists) {
        throw new Error('Already voted on this report')
      }

      tx.set(voteRef, { userId, voteType, votedAt: nowIso })

      const update: Record<string, unknown> = { updatedAt: nowIso }

      if (voteType === 'confirm') {
        update.confirmCount = FieldValue.increment(1)
        const newCount = Number(report.confirmCount ?? 0) + 1
        if (newCount >= config.minConfirmations) {
          update.status = 'confirmed'
          update.confirmationCount = newCount
          update.confirmedAt = nowIso
          const stationId = String(report.stationId ?? '')
          const price = Number(report.normalizedPrice ?? report.reportedPrice)
          if (stationId && Number.isFinite(price)) {
            tx.update(reportRef, update)
            return {
              stationId,
              fuelType: report.fuelType as FuelType,
              price,
              reportId,
              confirmationCount: newCount,
              reporterId: typeof report.reporterId === 'string' ? report.reporterId : null,
            }
          }
        }
      }

      if (voteType === 'reject') {
        update.rejectCount = FieldValue.increment(1)
        if (Number(report.rejectCount ?? 0) + 1 >= config.minConfirmations) {
          update.status = 'rejected'
        }
      }

      if (voteType === 'flag') {
        update.flagCount = FieldValue.increment(1)
        if (Number(report.flagCount ?? 0) + 1 >= config.flagThreshold) {
          update.status = 'flagged'
        }
      }

      tx.update(reportRef, update)
      return null
    })

    if (confirmedPrice) {
      await upsertConfirmedPrice({
        stationId: confirmedPrice.stationId,
        fuelType: confirmedPrice.fuelType,
        price: confirmedPrice.price,
        sourceType: 'community',
        confirmedReportId: confirmedPrice.reportId,
        confirmationCount: confirmedPrice.confirmationCount,
      })

      if (confirmedPrice.reporterId) {
        await db.collection('users').doc(confirmedPrice.reporterId).update({
          confirmedReportCount: FieldValue.increment(1),
          trustScore: FieldValue.increment(5),
          updatedAt: new Date().toISOString(),
        })
      }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Vote failed'
    return { error: message }
  }
}
