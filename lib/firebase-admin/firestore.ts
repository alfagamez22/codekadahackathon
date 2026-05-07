import 'server-only'
import { mockSystemConfig } from '@/lib/mock-data'

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
  return { ...mockSystemConfig }
}

// ---------------------------------------------------------------------------
// adminDb — no-op stub so existing call-sites that import it don't crash.
// All actual data access goes through lib/firebase-admin/queries/* which
// reads/writes the in-memory mock arrays in lib/mock-data.ts.
// ---------------------------------------------------------------------------

function noopCollection() {
  const proxy: Record<string, unknown> = {}
  return new Proxy(proxy, {
    get() {
      return (..._args: unknown[]) => Promise.resolve({ docs: [], exists: false, data: () => ({}) })
    },
  })
}

export const adminDb = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === 'collection' || prop === 'doc') {
        return (..._args: unknown[]) => noopCollection()
      }
      return (..._args: unknown[]) => Promise.resolve(null)
    },
  },
) as Record<string, (...args: unknown[]) => unknown>

// getAdminDb — used by the modular queries; returns the same no-op stub.
export async function getAdminDb() {
  return adminDb
}
