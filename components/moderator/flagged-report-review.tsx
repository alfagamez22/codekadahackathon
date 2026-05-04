'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { getFirebaseDb } from '@/lib/firebase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { flagReportAction } from '@/app/_actions/reports'
import { formatPeso, formatFuelType, formatRelativeTime } from '@/lib/utils/format'
import type { PriceReport } from '@/types/report'

export function FlaggedReportReview() {
  const [reports, setReports] = useState<PriceReport[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<string | null>(null)

  useEffect(() => {
    const q = query(
      collection(getFirebaseDb(), 'price_reports'),
      where('status', '==', 'flagged')
    )
    return onSnapshot(q, (snap) => {
      setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PriceReport)))
      setLoading(false)
    })
  }, [])

  const handleDismiss = async (reportId: string) => {
    setPending(reportId)
    await flagReportAction(reportId)
    setPending(null)
  }

  if (loading) return <div className="text-muted text-sm">Loading flagged reports...</div>

  if (reports.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <div className="text-4xl mb-3">✅</div>
        <div>No flagged reports. Queue is clear.</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {reports.map((report) => (
        <Card key={report.id}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="font-medium">{formatFuelType(report.fuelType)}</div>
              <div className="text-xl font-bold text-fuel-red mt-1">{formatPeso(report.reportedPrice)}</div>
              <div className="text-xs text-muted mt-1">
                Reported {formatRelativeTime(report.createdAt)} · {report.flagCount} flags
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="flagged" label="Flagged" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDismiss(report.id)}
                loading={pending === report.id}
              >
                Dismiss
              </Button>
            </div>
          </div>
          {report.evidenceUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={report.evidenceUrl}
              alt="Evidence"
              className="mt-3 rounded-lg max-h-40 object-contain bg-gray-50"
            />
          )}
        </Card>
      ))}
    </div>
  )
}
