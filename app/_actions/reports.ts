'use server'

import { requireAuth } from '@/lib/auth/guards'
import { getAdminDb, getSystemConfig } from '@/lib/firebase-admin/firestore'
import { getCurrentPrices } from '@/lib/firebase-admin/queries/prices'
import { priceReportSchema } from '@/lib/utils/validators'
import { incrementUserReportCount } from '@/lib/firebase-admin/queries/users'
import { updateTag } from 'next/cache'
import type { PriceReportInput } from '@/lib/utils/validators'

export async function submitPriceReportAction(input: PriceReportInput) {
  const session = await requireAuth()
  const parsed = priceReportSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { stationId, fuelType, reportedPrice, evidenceUrl } = parsed.data
  const config = await getSystemConfig()

  const db = await getAdminDb()
  const recentReports = await db
    .collection('priceReports')
    .where('reporterId', '==', session.uid)
    .get()

  const cooldownCutoffMs = Date.now() - config.reportCooldownHours * 60 * 60 * 1000
  const hasRecentDuplicate = recentReports.docs.some((doc) => {
    const report = doc.data() as {
      stationId?: string
      fuelType?: string
      status?: string
      createdAt?: string
    }

    if (report.stationId !== stationId || report.fuelType !== fuelType) {
      return false
    }

    if (report.status !== 'pending' && report.status !== 'confirmed') {
      return false
    }

    const createdAtMs = Date.parse(report.createdAt ?? '')
    return Number.isFinite(createdAtMs) && createdAtMs >= cooldownCutoffMs
  })

  if (hasRecentDuplicate) {
    return {
      error: `You already submitted a recent ${fuelType} report for this station. Try again after the cooldown window.`,
    }
  }

  const currentPrices = await getCurrentPrices(stationId)
  const matchingPrice = currentPrices.find((price) => price.fuelType === fuelType)
  const staleThresholdMs = config.stalePriceDays * 24 * 60 * 60 * 1000

  if (matchingPrice) {
    const updatedAtMs = Date.parse(matchingPrice.updatedAt)
    const isFreshEnough = Number.isFinite(updatedAtMs) && Date.now() - updatedAtMs <= staleThresholdMs

    if (isFreshEnough) {
      const deltaPercent = Math.abs(reportedPrice - matchingPrice.currentPrice) / matchingPrice.currentPrice * 100

      if (deltaPercent > config.priceTolerancePercent) {
        return {
          error: `Reported price differs too much from the current station price (${matchingPrice.currentPrice.toFixed(2)}).`,
        }
      }
    }
  }

  const expiresAt = new Date(Date.now() + config.reportExpiryHours * 3600 * 1000).toISOString()
  const nowIso = new Date().toISOString()
  const priceDeltaPercent = matchingPrice
    ? Number((((reportedPrice - matchingPrice.currentPrice) / matchingPrice.currentPrice) * 100).toFixed(2))
    : null

  const docRef = await db.collection('priceReports').add({
    stationId,
    fuelType,
    reportedPrice,
    normalizedPrice: Math.round(reportedPrice * 100) / 100,
    baselinePrice: matchingPrice?.currentPrice ?? null,
    priceDeltaPercent,
    reporterId: session.uid,
    evidenceUrl: evidenceUrl ?? null,
    status: 'pending',
    confirmCount: 0,
    rejectCount: 0,
    flagCount: 0,
    validatorThreshold: config.minConfirmations,
    expiresAt,
    createdAt: nowIso,
    updatedAt: nowIso,
  })

  await incrementUserReportCount(session.uid)
  updateTag('reports')

  return { success: true, reportId: docRef.id }
}

export async function flagReportAction(reportId: string) {
  await requireAuth()

  const db = await getAdminDb()
  await db.collection('priceReports').doc(reportId).update({
    status: 'flagged',
    updatedAt: new Date().toISOString(),
  })

  return { success: true }
}
