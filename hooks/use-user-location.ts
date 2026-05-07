'use client'

import { useState, useEffect } from 'react'

interface Location {
  lat: number
  lng: number
}

export function useUserLocation() {
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!navigator.geolocation) {
        setError('Geolocation not supported')
        return
      }

      setLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setLoading(false)
        },
        (err) => {
          setError(err.message)
          setLoading(false)
        },
      )
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  return { location, loading, error }
}
