'use client'

import { useState, useEffect } from 'react'
import { mockValidationVotes, mockPriceReports } from '@/lib/mock-data'
import type { PriceReport, ValidationVote } from '@/types/report'

export function useValidationVotes(reportId: string) {
  const [votes, setVotes] = useState<ValidationVote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const result = mockValidationVotes[reportId] ?? []
    setVotes(result)
    setLoading(false)
  }, [reportId])

  return { votes, loading }
}

export function usePendingReports() {
  const [reports, setReports] = useState<PriceReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const pending = mockPriceReports.filter((r) => r.status === 'pending')
    setReports(pending)
    setLoading(false)
  }, [])

  return { reports, loading }
}
