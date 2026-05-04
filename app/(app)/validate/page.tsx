'use client'

import { PageHeader } from '@/components/layout/page-header'
import { PendingReportCard } from '@/components/validate/pending-report-card'
import { usePendingReports } from '@/hooks/use-validation-votes'
import { StationListSkeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'

export default function ValidatePage() {
  const { user } = useAuth()
  const { reports, loading } = usePendingReports()

  return (
    <div>
      <PageHeader
        title="Validate Prices"
        description="Help the community by verifying reported fuel prices"
      />

      {loading && <StationListSkeleton />}

      {!loading && reports.length === 0 && (
        <div className="text-center py-12 text-muted">
          <div className="text-4xl mb-3">✅</div>
          <div>No pending reports. Check back later.</div>
        </div>
      )}

      {!loading && reports.length > 0 && (
        <div className="flex flex-col gap-4">
          {reports.map((report) => (
            <PendingReportCard key={report.id} report={report} currentUserId={user?.uid ?? ''} />
          ))}
        </div>
      )}
    </div>
  )
}
