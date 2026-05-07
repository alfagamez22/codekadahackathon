import { RoutePlanner } from '@/components/route/route-planner'
import { PageHeader } from '@/components/layout/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Route Planner' }

export default function RoutePlannerPage() {
  return (
    <div>
      <PageHeader
        title="GasTOS Route Planner"
        description="Plan your route, compare nearby stations, and estimate fuel savings."
      />
      <RoutePlanner />
    </div>
  )
}
