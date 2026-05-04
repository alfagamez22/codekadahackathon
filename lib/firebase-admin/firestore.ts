import 'server-only'
import { getFirestore } from 'firebase-admin/firestore'
import getAdminApp from './index'

function getAdminDb() {
  return getFirestore(getAdminApp())
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
  const snap = await getAdminDb().collection('systemConfig').doc('settings').get()

  if (!snap.exists) {
    return defaultSystemConfig
  }

  return {
    ...defaultSystemConfig,
    ...(snap.data() as Partial<SystemConfig>),
  }
}

export const adminDb = new Proxy({} as ReturnType<typeof getAdminDb>, {
  get(_, prop) {
    return (getAdminDb() as never as Record<string | symbol, unknown>)[prop as string | symbol]
  },
})
