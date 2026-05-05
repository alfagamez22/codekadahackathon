import { PageHeader } from '@/components/layout/page-header'
import { searchStations } from '@/lib/firebase-admin/queries/stations'
import { StationEditor } from '@/components/admin/station-editor'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Station Management' }

export default async function AdminStationsPage() {
  const { stations } = await searchStations({})

  return (
    <div>
      <PageHeader title="Stations" description="Manage gas station listings" />
      <StationEditor stations={stations} />
    </div>
  )
}
