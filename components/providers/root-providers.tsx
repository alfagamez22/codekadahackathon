'use client'

import { type ReactNode } from 'react'
import { AuthProvider } from './auth-provider'
import { QueryProvider } from './query-provider'
import { ToastProvider } from './toast-provider'

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
