'use client'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ValidationStatusBadge } from '@/components/reports/validation-status-badge'
import { VoteButtons } from './vote-buttons'
import { formatPeso, formatFuelType, formatRelativeTime } from '@/lib/utils/format'
import type { PriceReport } from '@/types/report'

interface PendingReportCardProps {
  report: PriceReport
  currentUserId: string
}

export function PendingReportCard({ report, currentUserId }: PendingReportCardProps) {
  const isOwn = report.reporterId === currentUserId

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base">{formatFuelType(report.fuelType)}</CardTitle>
            <div className="text-2xl font-bold text-fuel-green mt-1">{formatPeso(report.reportedPrice)}</div>
          </div>
          <ValidationStatusBadge
            status={report.status}
            confirmCount={report.confirmCount}
            rejectCount={report.rejectCount}
            flagCount={report.flagCount}
          />
        </div>
      </CardHeader>

      <div className="flex flex-col gap-3">
        {report.evidenceUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={report.evidenceUrl}
            alt="Price evidence"
            className="rounded-lg max-h-48 object-contain w-full bg-gray-50"
          />
        )}

        <div className="flex items-center gap-3 text-xs text-muted">
          <span>Reported {formatRelativeTime(report.createdAt)}</span>
          <span>·</span>
          <span>Expires {formatRelativeTime(report.expiresAt)}</span>
        </div>

        <div className="flex gap-2 text-xs">
          <Badge variant="confirmed" label={`${report.confirmCount} confirms`} />
          <Badge variant="rejected" label={`${report.rejectCount} rejects`} />
          {report.flagCount > 0 && <Badge variant="flagged" label={`${report.flagCount} flags`} />}
        </div>

        {isOwn ? (
          <p className="text-xs text-muted italic">You submitted this report</p>
        ) : (
          <VoteButtons reportId={report.id} disabled={report.status !== 'pending'} />
        )}
      </div>
    </Card>
  )
}
