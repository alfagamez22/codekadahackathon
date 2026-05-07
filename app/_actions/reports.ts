'use server'

import { requireAuth } from '@/lib/auth/guards'
import { getAdminDb, getSystemConfig } from '@/lib/firebase-admin/firestore'
import { getCurrentPrices } from '@/lib/firebase-admin/queries/prices'
import { externalPriceReportSchema, priceReportSchema } from '@/lib/utils/validators'
import { incrementUserReportCount } from '@/lib/firebase-admin/queries/users'
import { incrementReportCount } from '@/lib/firebase-admin/queries/analytics'
import { updateTag } from 'next/cache'
import { FieldValue, type QueryDocumentSnapshot } from 'firebase-admin/firestore'
import type { ExternalPriceReportInput, PriceReportInput } from '@/lib/utils/validators'

export async function submitPriceReportAction(input: PriceReportInput) {
  const session = await requireAuth();
  const parsed = priceReportSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { stationId, fuelType, reportedPrice, evidenceUrl } = parsed.data;
  const config = await getSystemConfig();

  const db = await getAdminDb();
  const recentReports = await db
    .collection("priceReports")
    .where("reporterId", "==", session.uid)
    .get();

  const cooldownCutoffMs =
    Date.now() - config.reportCooldownHours * 60 * 60 * 1000;
  const hasRecentDuplicate = recentReports.docs.some(
    (doc: QueryDocumentSnapshot) => {
      const report = doc.data() as {
        stationId?: string;
        fuelType?: string;
        status?: string;
        createdAt?: string;
      };

      if (report.stationId !== stationId || report.fuelType !== fuelType)
        return false;
      if (report.status !== "pending" && report.status !== "confirmed")
        return false;

      const createdAtMs = Date.parse(report.createdAt ?? "");
      return Number.isFinite(createdAtMs) && createdAtMs >= cooldownCutoffMs;
    },
  );

  if (hasRecentDuplicate) {
    return {
      error: `You already submitted a recent ${fuelType} report for this station. Try again after the cooldown window.`,
    };
  }

  const currentPrices = await getCurrentPrices(stationId);
  const matchingPrice = currentPrices.find(
    (price) => price.fuelType === fuelType,
  );
  const staleThresholdMs = config.stalePriceDays * 24 * 60 * 60 * 1000;

  if (matchingPrice) {
    const updatedAtMs = Date.parse(matchingPrice.updatedAt);
    const isFreshEnough =
      Number.isFinite(updatedAtMs) &&
      Date.now() - updatedAtMs <= staleThresholdMs;

    if (isFreshEnough) {
      const deltaPercent =
        (Math.abs(reportedPrice - matchingPrice.currentPrice) /
          matchingPrice.currentPrice) *
        100;

      if (deltaPercent > config.priceTolerancePercent) {
        return {
          error: `Reported price differs too much from the current station price (${matchingPrice.currentPrice.toFixed(2)}).`,
        };
      }
    }
  }

  const expiresAt = new Date(
    Date.now() + config.reportExpiryHours * 3600 * 1000,
  ).toISOString();
  const nowIso = new Date().toISOString();
  const priceDeltaPercent = matchingPrice
    ? Number(
        (
          ((reportedPrice - matchingPrice.currentPrice) /
            matchingPrice.currentPrice) *
          100
        ).toFixed(2),
      )
    : null;

  const docRef = await db.collection("priceReports").add({
    stationId,
    fuelType,
    reportedPrice,
    normalizedPrice: Math.round(reportedPrice * 100) / 100,
    baselinePrice: matchingPrice?.currentPrice ?? null,
    priceDeltaPercent,
    reporterId: session.uid,
    evidenceUrl: evidenceUrl ?? null,
    status: "pending",
    confirmCount: 0,
    rejectCount: 0,
    flagCount: 0,
    validatorThreshold: config.minConfirmations,
    expiresAt,
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  await incrementUserReportCount(session.uid);
  incrementReportCount().catch((err) => console.error('[stats] Failed to increment report count:', err));
  updateTag("reports");

  return { success: true, reportId: docRef.id };
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
  const db = await getAdminDb()

  const recentReports = await db
    .collection('priceReports')
    .where('reporterId', '==', session.uid)
    .get()

  const cooldownCutoffMs = Date.now() - config.reportCooldownHours * 60 * 60 * 1000
  const hasRecentDuplicate = recentReports.docs.some((doc: QueryDocumentSnapshot) => {
    const report = doc.data() as {
      stationId?: string
      fuelType?: string
      status?: string
      createdAt?: string
    }

    if (report.stationId !== stationId || report.fuelType !== fuelType) return false
    if (report.status !== 'pending' && report.status !== 'confirmed') return false

    const createdAtMs = Date.parse(report.createdAt ?? '')
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

  await db.collection('stations').doc(stationId).set(
    {
      id: stationId,
      name: station.name,
      brand: station.brand ?? null,
      address: station.area ?? null,
      barangay: null,
      city: station.area ?? 'Philippines',
      province: 'Philippines',
      latitude: station.lat,
      longitude: station.lng,
      fuelTypes: FieldValue.arrayUnion(fuelType),
      latestPrices: {},
      lastUpdatedAt: null,
      dataSource: 'community-gaswatchph',
      externalId: station.externalId,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    { merge: true },
  )

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
    externalStation: {
      name: station.name,
      brand: station.brand ?? null,
      area: station.area ?? null,
      lat: station.lat,
      lng: station.lng,
    },
    expiresAt,
    createdAt: nowIso,
    updatedAt: nowIso,
  })

  await incrementUserReportCount(session.uid)
  incrementReportCount().catch((err) => console.error('[stats] Failed to increment report count:', err))
  updateTag('reports')

  return { success: true, reportId: docRef.id }
}

export async function flagReportAction(reportId: string) {
  await requireAuth();

  const db = await getAdminDb();
  await db.collection("priceReports").doc(reportId).update({
    status: "flagged",
    updatedAt: new Date().toISOString(),
  });

  return { success: true };
}
