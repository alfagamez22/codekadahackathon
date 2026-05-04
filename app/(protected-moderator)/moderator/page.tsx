'use client'

import { PageHeader } from '@/components/layout/page-header'
import { FlaggedReportReview } from '@/components/moderator/flagged-report-review'

export default function ModeratorPage() {
  return (
    <div>
      <PageHeader
        title="Moderator Queue"
        description="Review flagged price reports"
      />
      <FlaggedReportReview />
    </div>
  )
}
