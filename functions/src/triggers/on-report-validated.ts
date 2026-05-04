import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { db } from '../utils/firestore-admin'
import sql from '../utils/db'
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

  // Upsert confirmed price to PostgreSQL
  await sql`
    INSERT INTO fuel_prices (id, station_id, fuel_type, current_price, source_type, confirmed_report_id, confirmation_count, updated_at)
    VALUES (${randomUUID()}, ${stationId}::uuid, ${fuelType}, ${reportedPrice}, 'community', ${reportId}, ${confirmationCount ?? 3}, now())
    ON CONFLICT (station_id, fuel_type) DO UPDATE SET
      current_price = EXCLUDED.current_price,
      source_type = 'community',
      confirmed_report_id = EXCLUDED.confirmed_report_id,
      confirmation_count = EXCLUDED.confirmation_count,
      updated_at = now()
  `

  // Write price history
  await sql`
    INSERT INTO price_history (id, station_id, fuel_type, new_price, source_type, report_id, changed_at)
    VALUES (${randomUUID()}, ${stationId}::uuid, ${fuelType}, ${reportedPrice}, 'community', ${reportId}, now())
  `

  // Send push notifications to subscribed users
  try {
    const stationDoc = await sql<{ name: string }[]>`SELECT name FROM stations WHERE id = ${stationId}::uuid`
    const stationName = stationDoc[0]?.name ?? 'Unknown Station'

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
