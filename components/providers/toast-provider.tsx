'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  toasts: Toast[]
  showToast: (message: string, type?: Toast['type']) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  showToast: () => {},
  dismissToast: () => {},
})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={cn(
              'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg pointer-events-auto',
              toast.type === 'success' && 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]',
              toast.type === 'error' && 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]',
              toast.type === 'info' && 'bg-white border-border text-foreground shadow-md',
            )}
          >
            <i className={cn(
              'text-base shrink-0 mt-0.5',
              toast.type === 'success' && 'ri-checkbox-circle-line',
              toast.type === 'error' && 'ri-error-warning-line',
              toast.type === 'info' && 'ri-information-line',
            )} />
            <span className="flex-1 font-medium">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <i className="ri-close-line" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
