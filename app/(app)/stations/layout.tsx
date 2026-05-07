import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Browse Stations' }

export default async function StationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
