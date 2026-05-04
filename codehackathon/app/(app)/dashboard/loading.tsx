import { StationListSkeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div>
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
      <StationListSkeleton count={3} />
    </div>
  )
}
