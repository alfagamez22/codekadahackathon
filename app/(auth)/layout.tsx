import { redirect } from 'next/navigation'
import { readSession } from '@/lib/auth/session'
import type { ReactNode } from 'react'

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await readSession()
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">⛽</div>
          <span className="text-xl font-bold text-fuel-green">GasTOS</span>
        </div>
        {children}
      </div>
    </div>
  )
}
