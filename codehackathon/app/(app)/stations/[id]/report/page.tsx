import { requireAuth } from '@/lib/auth/guards'
import { getStation } from '@/lib/db/queries/stations'
import { PageHeader } from '@/components/layout/page-header'
import { ReportForm } from '@/components/reports/report-form'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Report Price' }

export default async function ReportPricePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await requireAuth()

  const station = await getStation(id)
  if (!station) notFound()

  return (
    <div>
      <PageHeader
        title="Report Price"
        description={`${station.name} · ${station.city}`}
      />
      <ReportForm stationId={id} fuelTypes={station.fuelTypes} userId={session.uid} />
    </div>
  )
}
