'use server'

import { requireAuth } from '@/lib/auth/guards'
import { adminDb } from '@/lib/firebase-admin/firestore'
import { priceReportSchema } from '@/lib/utils/validators'
import { incrementUserReportCount } from '@/lib/db/queries/users'
import { updateTag } from 'next/cache'
import type { PriceReportInput } from '@/lib/utils/validators'

const REPORT_EXPIRY_HOURS = 72

export async function submitPriceReportAction(input: PriceReportInput) {
  const session = await requireAuth()
  const parsed = priceReportSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { stationId, fuelType, reportedPrice, evidenceUrl } = parsed.data

  const expiresAt = new Date(Date.now() + REPORT_EXPIRY_HOURS * 3600 * 1000).toISOString()

  const docRef = await adminDb.collection('priceReports').add({
    stationId,
    fuelType,
    reportedPrice,
    normalizedPrice: Math.round(reportedPrice * 100) / 100,
    reporterId: session.uid,
    evidenceUrl: evidenceUrl ?? null,
    status: 'pending',
    confirmCount: 0,
    rejectCount: 0,
    flagCount: 0,
    expiresAt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  await incrementUserReportCount(session.uid)
  updateTag('reports')

  return { success: true, reportId: docRef.id }
}

export async function flagReportAction(reportId: string) {
  await requireAuth()

  await adminDb.collection('priceReports').doc(reportId).update({
    status: 'flagged',
    updatedAt: new Date().toISOString(),
  })

  return { success: true }
}
