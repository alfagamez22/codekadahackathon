import { searchStations } from '@/lib/db/queries/stations'
import { StationList } from '@/components/stations/station-list'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Browse Stations' }

export default async function StationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
