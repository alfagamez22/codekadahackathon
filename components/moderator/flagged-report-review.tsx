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
      collection(getFirebaseDb(), 'priceReports'),
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

  if (loading) return <p className="text-sm text-muted-foreground">Loading flagged reports...</p>

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-border bg-muted/30">
        <i className="ri-checkbox-circle-line text-3xl text-[#16a34a] mb-3" />
        <p className="text-sm text-muted-foreground">No flagged reports. Queue is clear.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {reports.map((report) => (
        <Card key={report.id}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm font-medium text-foreground">{formatFuelType(report.fuelType)}</div>
              <div className="text-xl font-semibold tabular-nums text-destructive mt-1">{formatPeso(report.reportedPrice)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Reported {formatRelativeTime(report.createdAt)} · {report.flagCount} flags
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="flagged" />
              <Button size="sm" variant="secondary" onClick={() => handleDismiss(report.id)} loading={pending === report.id}>
                Dismiss
              </Button>
            </div>
          </div>
          {report.evidenceUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={report.evidenceUrl} alt="Evidence" className="mt-3 rounded-md max-h-40 object-contain bg-muted border border-border" />
          )}
        </Card>
      ))}
    </div>
  )
}
