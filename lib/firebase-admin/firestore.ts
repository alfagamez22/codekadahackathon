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

// Proxy that resolves the async db before forwarding every call.
// Usage: await adminDb.collection('x').then(col => col.doc('y').get())
// Or for convenience: const db = await getDb(); db.collection(...).doc(...).get()
export const adminDb = new Proxy({} as any, {
  get(_, prop) {
    if (prop === 'collection' || prop === 'doc') {
      return (...args: any[]) =>
        getAdminDb().then((db) => {
          const target = (db as any)[prop]
          return target.apply(db, args)
        })
    }

    return (...args: any[]) =>
      getAdminDb()
        .then((db) => {
          const target = (db as any)[prop]
          if (typeof target === 'function') return target.apply(db, args)
          return target
        })
        .catch((err) => {
          console.error(`adminDb.${String(prop)} failed:`, err)
          throw err
        })
  },
})

// Convenience export for code that needs direct db access without the proxy
export { getAdminDb }
