import { Badge } from '@/components/ui/badge'
import type { ReportStatus } from '@/types/report'

interface ValidationStatusBadgeProps {
  status: ReportStatus
  confirmCount?: number
  rejectCount?: number
  flagCount?: number
}

export function ValidationStatusBadge({ status, confirmCount = 0, rejectCount = 0, flagCount = 0 }: ValidationStatusBadgeProps) {
  const labels: Record<ReportStatus, string> = {
    pending: `Pending (${confirmCount}/3 confirms)`,
    confirmed: 'Community Verified',
    rejected: 'Rejected',
    flagged: 'Flagged for Review',
    expired: 'Expired',
  }

  const variants: Record<ReportStatus, 'pending' | 'confirmed' | 'rejected' | 'flagged' | 'stale'> = {
    pending: 'pending',
    confirmed: 'confirmed',
    rejected: 'rejected',
    flagged: 'flagged',
    expired: 'stale',
  }

  return <Badge variant={variants[status]} label={labels[status]} />
}
