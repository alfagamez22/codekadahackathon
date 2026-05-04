import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getStation } from '@/lib/db/queries/stations'
import { getCurrentPrices } from '@/lib/db/queries/prices'
import { FuelPriceTable } from '@/components/stations/fuel-price-table'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { requireAuth } from '@/lib/auth/guards'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id } = await props.params
  const station = await getStation(id)
  return { title: station?.name ?? 'Station' }
}

export default async function StationDetailPage(props: Props) {
  const { id } = await props.params
  await requireAuth()

  const [station, prices] = await Promise.all([
    getStation(id),
    getCurrentPrices(id),
  ])

  if (!station) notFound()

  return (
    <div>
      <PageHeader
        title={station.name}
        description={`${station.brand ? station.brand + ' · ' : ''}${station.city}, ${station.province}`}
        action={
          <Link href={`/stations/${id}/report`}>
            <Button size="sm">+ Report Price</Button>
          </Link>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Prices */}
          <Card>
            <CardHeader><CardTitle>Current Fuel Prices</CardTitle></CardHeader>
            <FuelPriceTable prices={prices} />
          </Card>

          {/* Price history link */}
          <div className="flex justify-end">
            <Link href={`/stations/${id}/history`}>
              <Button variant="ghost" size="sm">📊 View Price History</Button>
            </Link>
          </div>
        </div>

        {/* Station info */}
        <div>
          <Card>
            <CardHeader><CardTitle>Station Info</CardTitle></CardHeader>
            <dl className="flex flex-col gap-3 text-sm">
              {station.brand && (
                <div><dt className="text-muted">Brand</dt><dd className="font-medium">{station.brand}</dd></div>
              )}
              {station.address && (
                <div><dt className="text-muted">Address</dt><dd className="font-medium">{station.address}</dd></div>
              )}
              <div><dt className="text-muted">City</dt><dd className="font-medium">{station.city}</dd></div>
              <div><dt className="text-muted">Province</dt><dd className="font-medium">{station.province}</dd></div>
              <div>
                <dt className="text-muted">Fuel Types</dt>
                <dd className="font-medium capitalize">{station.fuelTypes.join(', ')}</dd>
              </div>
              <div>
                <dt className="text-muted">Coordinates</dt>
                <dd className="text-xs font-mono">{station.latitude.toFixed(6)}, {station.longitude.toFixed(6)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  )
}
