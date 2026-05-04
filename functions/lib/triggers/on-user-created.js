"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreatedHandler = void 0;
const v1_1 = require("firebase-functions/v1");
const db_1 = __importDefault(require("../utils/db"));
const firestore_admin_1 = require("../utils/firestore-admin");
exports.onUserCreatedHandler = v1_1.auth.user().onCreate(async (user) => {
    const { uid, email, displayName, photoURL } = user;
    const nowIso = new Date().toISOString();
    await (0, db_1.default) `
    INSERT INTO users (id, display_name, email, photo_url, role, trust_score, report_count, confirmed_report_count)
    VALUES (${uid}, ${displayName ?? null}, ${email ?? null}, ${photoURL ?? null}, 'user', 0, 0, 0)
    ON CONFLICT (id) DO NOTHING
  `;
    await firestore_admin_1.db.collection('users').doc(uid).set({
        uid,
        email: email ?? null,
        displayName: displayName ?? null,
        photoURL: photoURL ?? null,
        role: 'user',
        trustScore: 0,
        reportCount: 0,
        confirmedReportCount: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
        mirroredAt: nowIso,
    }, { merge: true });
    console.log(`Mirrored new user ${uid} to PostgreSQL`);
});
//# sourceMappingURL=on-user-created.js.map