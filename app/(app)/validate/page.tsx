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
        <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-border bg-card">
          <i className="ri-checkbox-circle-line text-4xl text-[#16a34a] mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">All caught up</p>
          <p className="text-xs text-muted-foreground">No pending reports. Check back later.</p>
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
