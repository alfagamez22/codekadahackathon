import 'server-only'
import { getFirestore } from 'firebase-admin/firestore'
import getAdminApp from './index'

async function getAdminDb() {
  const app = await getAdminApp()
  return getFirestore(app)
}

export const defaultSystemConfig = {
  minConfirmations: 4,
  flagThreshold: 3,
  reportExpiryHours: 72,
  reportCooldownHours: 6,
  priceTolerancePercent: 2,
  stalePriceDays: 7,
}

export type SystemConfig = typeof defaultSystemConfig

export async function getSystemConfig(): Promise<SystemConfig> {
  const db = await getAdminDb()
  const snap = await db.collection('systemConfig').doc('settings').get()

  if (!snap.exists) {
    return defaultSystemConfig
  }

  return {
    ...defaultSystemConfig,
    ...(snap.data() as Partial<SystemConfig>),
  }
}

export const adminDb = new Proxy({} as any, {
  get(_, prop) {
    // If they access .collection directly on the proxy
    if (prop === 'collection' || prop === 'doc') {
      return (...args: any[]) => {
        return getAdminDb().then(db => {
          const target = (db as any)[prop];
          const result = target.apply(db, args);
          return result;
        });
      };
    }

    const d = getAdminDb();
    return (...args: any[]) => d.then(db => {
      const target = (db as any)[prop];
      if (typeof target === 'function') {
        return target.apply(db, args)
      }
      return target
    }).catch(err => {
      console.error(`adminDb.${prop.toString()} failed:`, err);
      throw err;
    });
  },
})
