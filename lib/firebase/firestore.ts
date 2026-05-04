import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  type CollectionReference,
  type DocumentReference,
} from 'firebase/firestore'
import { getFirebaseDb } from './client'
import type { PriceReport } from '@/types/report'

export function getPriceReportsRef(): CollectionReference<PriceReport> {
  return collection(getFirebaseDb(), 'priceReports') as CollectionReference<PriceReport>
}

export function getSystemConfigRef() {
  return doc(getFirebaseDb(), 'systemConfig', 'settings')
}

export function getReportRef(reportId: string): DocumentReference<PriceReport> {
  return doc(getFirebaseDb(), 'priceReports', reportId) as DocumentReference<PriceReport>
}

export function getVoteRef(reportId: string, userId: string) {
  return doc(getFirebaseDb(), 'priceReports', reportId, 'votes', userId)
}

export function subscribeToPendingReports(
  callback: (reports: PriceReport[]) => void,
  pageLimit = 20
) {
  const q = query(
    getPriceReportsRef(),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'),
    limit(pageLimit)
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => {
      const { id: _id, ...rest } = d.data() as PriceReport & { id?: string }
      return { id: d.id, ...rest } as PriceReport
    }))
  })
}

export function subscribeToReport(reportId: string, callback: (report: PriceReport | null) => void) {
  return onSnapshot(getReportRef(reportId), (snap) => {
    callback(snap.exists() ? (() => {
      const { id: _id, ...rest } = snap.data() as PriceReport & { id?: string }
      return { id: snap.id, ...rest } as PriceReport
    })() : null)
  })
}
