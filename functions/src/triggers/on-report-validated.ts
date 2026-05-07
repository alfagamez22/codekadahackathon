import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { db } from '../utils/firestore-admin'
import { sendPriceUpdateNotification } from '../utils/notify'
import { randomUUID } from 'crypto'

export const onReportValidated = onDocumentUpdated('priceReports/{reportId}', async (event) => {
  const before = event.data?.before.data()
  const after = event.data?.after.data()

  if (!before || !after) return
  if (before.status === after.status) return
  if (after.status !== 'confirmed') return

  const { stationId, fuelType, reportedPrice, confirmationCount } = after
  const reportId = event.params.reportId
  const nowIso = new Date().toISOString()
  const priceDocId = `${stationId}_${fuelType}`

  const existingSnap = await db.collection('fuelPrices').doc(priceDocId).get()
  const oldPrice = existingSnap.exists
    ? (existingSnap.data() as { currentPrice: number }).currentPrice
    : null

  const priceData = {
    id: priceDocId,
    stationId,
    fuelType,
    currentPrice: reportedPrice,
    sourceType: 'community',
    confirmedReportId: reportId,
    confirmationCount: confirmationCount ?? 3,
    updatedAt: nowIso,
  }

  const historyId = randomUUID()
  const historyData = {
    id: historyId,
    stationId,
    fuelType,
    oldPrice,
    newPrice: reportedPrice,
    sourceType: 'community',
    reportId,
    changedAt: nowIso,
  }

  await Promise.all([
    db.collection('fuelPrices').doc(priceDocId).set(priceData),
    db.collection('priceHistory').doc(historyId).set(historyData),
    db.collection('stations').doc(stationId).update({
      [`latestPrices.${fuelType}`]: {
        price: reportedPrice,
        sourceType: 'community',
        badge: 'community-verified',
        updatedAt: nowIso,
        confirmationCount: confirmationCount ?? 3,
      },
      lastUpdatedAt: nowIso,
      updatedAt: nowIso,
    }),
  ])

  // Send push notifications
  try {
    const stationSnap = await db.collection('stations').doc(stationId).get()
    const stationName = stationSnap.exists
      ? (stationSnap.data() as { name: string }).name
      : 'Unknown Station'

    const subsSnap = await db.collection('pushSubscriptions').get()
    const tokens: string[] = subsSnap.docs
      .map((d) => d.data().token as string)
      .filter(Boolean)

    if (tokens.length > 0) {
      await sendPriceUpdateNotification({ stationName, fuelType, newPrice: reportedPrice, tokens })
    }
  } catch (err) {
    console.error('Failed to send push notifications:', err)
  }
})
