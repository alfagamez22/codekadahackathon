'use server'

import { requireAuth } from '@/lib/auth/guards'
import { getSystemConfig } from '@/lib/firebase-admin/firestore'
import { getCurrentPrices } from '@/lib/firebase-admin/queries/prices'
import { externalPriceReportSchema, priceReportSchema } from '@/lib/utils/validators'
import { incrementUserReportCount } from '@/lib/firebase-admin/queries/users'
import { incrementReportCount } from '@/lib/firebase-admin/queries/analytics'
import { updateTag } from 'next/cache'
import { randomUUID } from 'crypto'
import { mockPriceReports, mockStations } from '@/lib/mock-data'
import type { ExternalPriceReportInput, PriceReportInput } from '@/lib/utils/validators'
import type { PriceReport } from '@/types/report'

export async function submitPriceReportAction(input: PriceReportInput) {
  const session = await requireAuth()
  const parsed = priceReportSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { stationId, fuelType, reportedPrice, evidenceUrl } = parsed.data
  const config = await getSystemConfig()

  const cooldownCutoffMs = Date.now() - config.reportCooldownHours * 60 * 60 * 1000
  const hasRecentDuplicate = mockPriceReports.some((report) => {
    if (report.stationId !== stationId || report.fuelType !== fuelType) return false
    if (report.status !== 'pending' && report.status !== 'confirmed') return false
    if (report.reporterId !== session.uid) return false
    const createdAtMs = Date.parse(report.createdAt)
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
    const isFreshEnough =
      Number.isFinite(updatedAtMs) && Date.now() - updatedAtMs <= staleThresholdMs

    if (isFreshEnough) {
      const deltaPercent =
        (Math.abs(reportedPrice - matchingPrice.currentPrice) / matchingPrice.currentPrice) * 100
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
  const reportId = randomUUID()

  const newReport: PriceReport = {
    id: reportId,
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
  }

  mockPriceReports.push(newReport)

  await incrementUserReportCount(session.uid)
  void incrementReportCount()
  updateTag('reports')

  return { success: true, reportId }
}

export async function submitExternalPriceReportAction(input: ExternalPriceReportInput) {
  const session = await requireAuth()
  const parsed = externalPriceReportSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { station, fuelType, reportedPrice, evidenceUrl } = parsed.data
  const stationId = station.externalId.startsWith('gaswatch-')
    ? station.externalId
    : `gaswatch-${station.externalId}`
  const config = await getSystemConfig()

  const cooldownCutoffMs = Date.now() - config.reportCooldownHours * 60 * 60 * 1000
  const hasRecentDuplicate = mockPriceReports.some((report) => {
    if (report.stationId !== stationId || report.fuelType !== fuelType) return false
    if (report.status !== 'pending' && report.status !== 'confirmed') return false
    if (report.reporterId !== session.uid) return false
    const createdAtMs = Date.parse(report.createdAt)
    return Number.isFinite(createdAtMs) && createdAtMs >= cooldownCutoffMs
  })

  if (hasRecentDuplicate) {
    return {
      error: `You already submitted a recent ${fuelType} callout for this station. Try again after the cooldown window.`,
    }
  }

  const currentPrices = await getCurrentPrices(stationId)
  const matchingPrice = currentPrices.find((price) => price.fuelType === fuelType)
  const expiresAt = new Date(Date.now() + config.reportExpiryHours * 3600 * 1000).toISOString()
  const nowIso = new Date().toISOString()
  const priceDeltaPercent = matchingPrice
    ? Number((((reportedPrice - matchingPrice.currentPrice) / matchingPrice.currentPrice) * 100).toFixed(2))
    : null

  // Upsert station in mock data
  const existingStationIdx = mockStations.findIndex((s) => s.id === stationId)
  if (existingStationIdx === -1) {
    mockStations.push({
      id: stationId,
      name: station.name,
      brand: station.brand ?? null,
      address: station.area ?? null,
      barangay: null,
      city: station.area ?? 'Philippines',
      province: 'Philippines',
      latitude: station.lat,
      longitude: station.lng,
      fuelTypes: [fuelType],
      latestPrices: {},
      lastUpdatedAt: null,
      dataSource: 'community-gaswatchph',
      externalId: station.externalId,
      createdAt: nowIso,
      updatedAt: nowIso,
    })
  } else {
    const existing = mockStations[existingStationIdx]
    if (!existing.fuelTypes.includes(fuelType)) {
      mockStations[existingStationIdx] = {
        ...existing,
        fuelTypes: [...existing.fuelTypes, fuelType],
        updatedAt: nowIso,
      }
    }
  }

  const reportId = randomUUID()
  mockPriceReports.push({
    id: reportId,
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
  void incrementReportCount()
  updateTag('reports')

  return { success: true, reportId }
}

export async function flagReportAction(reportId: string) {
  await requireAuth()

  const idx = mockPriceReports.findIndex((r) => r.id === reportId)
  if (idx !== -1) {
    mockPriceReports[idx] = {
      ...mockPriceReports[idx],
      status: 'flagged',
      updatedAt: new Date().toISOString(),
    }
  }

  return { success: true }
}
