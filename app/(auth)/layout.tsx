import { redirect } from 'next/navigation'
import { readSession } from '@/lib/auth/session'
import type { ReactNode } from 'react'

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await readSession()
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9fafb] px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#0a0a0a]">
            <i className="ri-gas-station-fill text-sm text-white" />
          </div>
          <span className="text-base font-semibold tracking-[-0.01em] text-[#0a0a0a]">GASTOS</span>
        </div>
        {children}
      </div>
    </div>
  )
}
