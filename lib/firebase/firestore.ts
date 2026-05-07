import { mockPriceReports } from '@/lib/mock-data'
import type { PriceReport } from '@/types/report'

// ---------------------------------------------------------------------------
// Client-side Firestore stubs — all real-time subscriptions return hardcoded
// mock data immediately with a no-op unsubscribe function.
// ---------------------------------------------------------------------------

export function getPriceReportsRef() {
  return null as unknown as import('firebase/firestore').CollectionReference<PriceReport>
}

export function getSystemConfigRef() {
  return null as unknown as import('firebase/firestore').DocumentReference
}

export function getReportRef(reportId: string) {
  return null as unknown as import('firebase/firestore').DocumentReference<PriceReport>
}

export function getVoteRef(_reportId: string, _userId: string) {
  return null as unknown as import('firebase/firestore').DocumentReference
}

export function subscribeToPendingReports(
  callback: (reports: PriceReport[]) => void,
  _pageLimit = 20,
): () => void {
  const pending = mockPriceReports.filter((r) => r.status === 'pending')
  // Call synchronously on next tick to mimic snapshot behaviour
  setTimeout(() => callback(pending), 0)
  return () => {}
}

export function subscribeToReport(
  reportId: string,
  callback: (report: PriceReport | null) => void,
): () => void {
  const report = mockPriceReports.find((r) => r.id === reportId) ?? null
  setTimeout(() => callback(report), 0)
  return () => {}
}
