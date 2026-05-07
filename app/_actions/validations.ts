'use server'

import { requireAuth } from '@/lib/auth/guards'
import { getSystemConfig } from '@/lib/firebase-admin/firestore'
import { upsertConfirmedPrice } from '@/lib/firebase-admin/queries/prices'
import { voteSchema } from '@/lib/utils/validators'
import { mockPriceReports, mockValidationVotes, mockUsers } from '@/lib/mock-data'
import { randomUUID } from 'crypto'
import type { VoteType } from '@/types/report'
import type { FuelType } from '@/types/station'

export async function castVoteAction(input: { reportId: string; voteType: VoteType }) {
  const session = await requireAuth()
  const parsed = voteSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { reportId, voteType } = parsed.data
  const userId = session.uid

  try {
    const config = await getSystemConfig()
    const reportIdx = mockPriceReports.findIndex((r) => r.id === reportId)
    if (reportIdx === -1) return { error: 'Report not found' }

    const report = mockPriceReports[reportIdx]
    const nowIso = new Date().toISOString()
    const expiresAtMs = Date.parse(report.expiresAt)

    if (report.reporterId === userId) return { error: 'Cannot vote on your own report' }
    if (report.status !== 'pending') return { error: 'Report is no longer pending' }
    if (Number.isFinite(expiresAtMs) && expiresAtMs <= Date.now()) {
      mockPriceReports[reportIdx] = { ...report, status: 'expired', updatedAt: nowIso }
      return { error: 'Report has expired' }
    }

    const existingVotes = mockValidationVotes[reportId] ?? []
    if (existingVotes.some((v) => v.userId === userId)) {
      return { error: 'Already voted on this report' }
    }

    // Record vote
    if (!mockValidationVotes[reportId]) mockValidationVotes[reportId] = []
    mockValidationVotes[reportId].push({
      id: randomUUID(),
      reportId,
      userId,
      voteType,
      votedAt: nowIso,
    })

    const updated = { ...report, updatedAt: nowIso }

    if (voteType === 'confirm') {
      updated.confirmCount = report.confirmCount + 1
      if (updated.confirmCount >= config.minConfirmations) {
        updated.status = 'confirmed'
        updated.confirmationCount = updated.confirmCount
        updated.confirmedAt = nowIso

        // Promote price
        const stationId = report.stationId
        const price = report.normalizedPrice ?? report.reportedPrice
        if (stationId && Number.isFinite(price)) {
          mockPriceReports[reportIdx] = updated
          await upsertConfirmedPrice({
            stationId,
            fuelType: report.fuelType as FuelType,
            price,
            sourceType: 'community',
            confirmedReportId: reportId,
            confirmationCount: updated.confirmCount,
          })

          // Credit reporter
          if (report.reporterId) {
            const userIdx = mockUsers.findIndex((u) => u.uid === report.reporterId)
            if (userIdx !== -1) {
              mockUsers[userIdx] = {
                ...mockUsers[userIdx],
                confirmedReportCount: mockUsers[userIdx].confirmedReportCount + 1,
                trustScore: mockUsers[userIdx].trustScore + 5,
                updatedAt: nowIso,
              }
            }
          }
          return { success: true }
        }
      }
    } else if (voteType === 'reject') {
      updated.rejectCount = report.rejectCount + 1
      if (updated.rejectCount >= config.minConfirmations) updated.status = 'rejected'
    } else if (voteType === 'flag') {
      updated.flagCount = report.flagCount + 1
      if (updated.flagCount >= config.flagThreshold) updated.status = 'flagged'
    }

    mockPriceReports[reportIdx] = updated
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Vote failed'
    return { error: message }
  }
}
