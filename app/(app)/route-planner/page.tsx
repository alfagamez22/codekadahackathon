import { RoutePlannerDev } from '@/components/route/route-planner-dev'
import { PageHeader } from '@/components/layout/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Route Planner' }

export default function RoutePlannerPage() {
  return (
    <div>
      <PageHeader
        title="Route Planner"
        description="Plan your route and find fuel stations along the way."
      />
      <RoutePlannerDev />
    </div>
  )
}
