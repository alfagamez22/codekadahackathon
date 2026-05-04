'use client'

import { useState, useEffect } from 'react'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const online = () => setIsOnline(true)
    const offline = () => setIsOnline(false)
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed top-0 inset-x-0 bg-fuel-red text-white text-center text-sm py-2 z-50">
      You are offline. Some features may be unavailable.
    </div>
  )
}
