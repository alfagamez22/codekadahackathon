'use client'

import { useState } from 'react'
import { getFCMToken } from '@/lib/firebase/messaging'

export function usePushNotifications() {
  const [subscribing, setSubscribing] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subscribe = async () => {
    setSubscribing(true)
    setError(null)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setError('Notification permission denied.')
        return
      }
      const token = await getFCMToken()
      if (!token) {
        setError('Could not get push token.')
        return
      }
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) throw new Error('Failed to save subscription')
      setSubscribed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubscribing(false)
    }
  }

  const unsubscribe = async () => {
    const res = await fetch('/api/notifications/subscribe', { method: 'DELETE' })
    if (res.ok) setSubscribed(false)
  }

  return { subscribe, unsubscribe, subscribing, subscribed, error }
}
