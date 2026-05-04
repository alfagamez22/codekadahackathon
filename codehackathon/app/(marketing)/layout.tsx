import { redirect } from 'next/navigation'
import { readSession } from '@/lib/auth/session'
import { Header } from '@/components/layout/header'
import type { ReactNode } from 'react'

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const session = await readSession()
  if (session) redirect('/dashboard')

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  )
}
