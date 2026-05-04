"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onReportValidated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_admin_1 = require("../utils/firestore-admin");
const db_1 = __importDefault(require("../utils/db"));
const notify_1 = require("../utils/notify");
const crypto_1 = require("crypto");
exports.onReportValidated = (0, firestore_1.onDocumentUpdated)('priceReports/{reportId}', async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after)
        return;
    if (before.status === after.status)
        return;
    if (after.status !== 'confirmed')
        return;
    const { stationId, fuelType, reportedPrice, confirmationCount } = after;
    const reportId = event.params.reportId;
    const mirroredAt = new Date().toISOString();
    // Upsert confirmed price to PostgreSQL
    await (0, db_1.default) `
    INSERT INTO fuel_prices (id, station_id, fuel_type, current_price, source_type, confirmed_report_id, confirmation_count, updated_at)
    VALUES (${(0, crypto_1.randomUUID)()}, ${stationId}::uuid, ${fuelType}, ${reportedPrice}, 'community', ${reportId}, ${confirmationCount ?? 3}, now())
    ON CONFLICT (station_id, fuel_type) DO UPDATE SET
      current_price = EXCLUDED.current_price,
      source_type = 'community',
      confirmed_report_id = EXCLUDED.confirmed_report_id,
      confirmation_count = EXCLUDED.confirmation_count,
      updated_at = now()
  `;
    // Write price history
    await (0, db_1.default) `
    INSERT INTO price_history (id, station_id, fuel_type, new_price, source_type, report_id, changed_at)
    VALUES (${(0, crypto_1.randomUUID)()}, ${stationId}::uuid, ${fuelType}, ${reportedPrice}, 'community', ${reportId}, now())
  `;
    const currentPriceRows = await (0, db_1.default) `
    SELECT
      id::text,
      station_id::text AS "stationId",
      fuel_type AS "fuelType",
      current_price::float AS "currentPrice",
      source_type AS "sourceType",
      confirmed_report_id AS "confirmedReportId",
      confirmation_count AS "confirmationCount",
      updated_at AS "updatedAt"
    FROM fuel_prices
    WHERE station_id = ${stationId}::uuid AND fuel_type = ${fuelType}
  `;
    const latestHistoryRows = await (0, db_1.default) `
    SELECT
      id::text,
      station_id::text AS "stationId",
      fuel_type AS "fuelType",
      old_price::float AS "oldPrice",
      new_price::float AS "newPrice",
      source_type AS "sourceType",
      report_id AS "reportId",
      changed_at AS "changedAt"
    FROM price_history
    WHERE station_id = ${stationId}::uuid AND fuel_type = ${fuelType}
    ORDER BY changed_at DESC, id DESC
    LIMIT 1
  `;
    if (currentPriceRows[0]) {
        await firestore_admin_1.db.collection('fuelPrices').doc(currentPriceRows[0].id).set({
            ...currentPriceRows[0],
            mirroredAt,
        }, { merge: true });
    }
    if (latestHistoryRows[0]) {
        await firestore_admin_1.db.collection('priceHistory').doc(latestHistoryRows[0].id).set({
            ...latestHistoryRows[0],
            mirroredAt,
        }, { merge: true });
    }
    // Send push notifications to subscribed users
    try {
        const stationDoc = await (0, db_1.default) `SELECT name FROM stations WHERE id = ${stationId}::uuid`;
        const stationName = stationDoc[0]?.name ?? 'Unknown Station';
        const subsSnap = await firestore_admin_1.db.collection('pushSubscriptions').get();
        const tokens = subsSnap.docs
            .map((d) => d.data().token)
            .filter(Boolean);
        if (tokens.length > 0) {
            await (0, notify_1.sendPriceUpdateNotification)({ stationName, fuelType, newPrice: reportedPrice, tokens });
        }
    }
    catch (err) {
        console.error('Failed to send push notifications:', err);
    }
});
//# sourceMappingURL=on-report-validated.js.map