'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const REFRESH_INTERVAL_MS = 15 * 60 * 1000 // 15 minutes

export function PriceAutoRefresher() {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh()
    }, REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [router])

  return null
}
