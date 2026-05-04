'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, type Unsubscribe } from 'firebase/firestore'
import { getFirebaseDb } from '@/lib/firebase/client'
import type { PriceReport, ValidationVote } from '@/types/report'

export function useValidationVotes(reportId: string) {
  const [votes, setVotes] = useState<ValidationVote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const votesRef = collection(getFirebaseDb(), 'price_reports', reportId, 'votes')
    const unsub = onSnapshot(votesRef, (snap) => {
      setVotes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ValidationVote)))
      setLoading(false)
    })
    return unsub
  }, [reportId])

  return { votes, loading }
}

export function usePendingReports() {
  const [reports, setReports] = useState<PriceReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const reportsRef = collection(getFirebaseDb(), 'price_reports')
    const q = query(reportsRef, where('status', '==', 'pending'))
    const unsub: Unsubscribe = onSnapshot(q, (snap) => {
      setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PriceReport)))
      setLoading(false)
    })
    return unsub
  }, [])

  return { reports, loading }
}
