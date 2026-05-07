'use client'

import { useSyncExternalStore } from 'react'

function subscribeToOnlineStatus(onStoreChange: () => void) {
  window.addEventListener('online', onStoreChange)
  window.addEventListener('offline', onStoreChange)
  return () => {
    window.removeEventListener('online', onStoreChange)
    window.removeEventListener('offline', onStoreChange)
  }
}

const getOnlineSnapshot = () => navigator.onLine
const getServerOnlineSnapshot = () => true

export function OfflineIndicator() {
  const isOnline = useSyncExternalStore(subscribeToOnlineStatus, getOnlineSnapshot, getServerOnlineSnapshot)

  if (isOnline) return null

  return (
    <div className="fixed top-0 inset-x-0 bg-[#dc2626] text-white text-center text-xs font-medium py-2 z-50 flex items-center justify-center gap-2">
      <i className="ri-wifi-off-line" />
      You are offline. Some features may be unavailable.
    </div>
  )
}
