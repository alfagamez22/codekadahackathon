import { Card } from '@/components/ui/card'
import { ValidationStatusBadge } from './validation-status-badge'
import { formatPeso, formatFuelType, formatRelativeTime } from '@/lib/utils/format'
import type { PriceReport } from '@/types/report'

interface ReportCardProps {
  report: PriceReport
}

export function ReportCard({ report }: ReportCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm font-medium text-muted">{formatFuelType(report.fuelType)}</div>
          <div className="text-xl font-bold text-foreground mt-0.5">{formatPeso(report.reportedPrice)}</div>
          <div className="text-xs text-muted mt-1">{formatRelativeTime(report.createdAt)}</div>
        </div>
        <ValidationStatusBadge
          status={report.status}
          confirmCount={report.confirmCount}
          rejectCount={report.rejectCount}
          flagCount={report.flagCount}
        />
      </div>
    </Card>
  )
}
