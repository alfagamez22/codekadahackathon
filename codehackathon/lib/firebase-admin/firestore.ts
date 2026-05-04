import 'server-only'
import { getFirestore } from 'firebase-admin/firestore'
import getAdminApp from './index'

function getAdminDb() {
  return getFirestore(getAdminApp())
}

export async function getSystemConfig() {
  const snap = await getAdminDb().collection('systemConfig').doc('settings').get()
  return snap.exists
    ? (snap.data() as {
        minConfirmations: number
        flagThreshold: number
        reportExpiryHours: number
        priceTolerancePercent: number
        stalePriceDays: number
      })
    : {
        minConfirmations: 3,
        flagThreshold: 3,
        reportExpiryHours: 72,
        priceTolerancePercent: 2,
        stalePriceDays: 7,
      }
}

export const adminDb = new Proxy({} as ReturnType<typeof getAdminDb>, {
  get(_, prop) {
    return (getAdminDb() as never as Record<string | symbol, unknown>)[prop as string | symbol]
  },
})
