import { redirect } from 'next/navigation'
import { readSession } from '@/lib/auth/session'
import type { ReactNode } from 'react'

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await readSession()
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9fafb] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-0.5 mb-8">
          <span className="rounded-md bg-[#16a34a] px-3 py-1 text-3xl font-black text-white leading-tight tracking-tight">GAS</span>
          <span className="text-3xl font-black text-[#0a0a0a] leading-tight tracking-tight">TOS</span>
        </div>
        {children}
      </div>
    </div>
  )
}
