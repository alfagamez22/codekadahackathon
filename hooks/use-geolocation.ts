'use client'

import { useState, useEffect } from 'react'

interface Coords {
  lat: number
  lng: number
}

interface GeolocationState {
  coords: Coords | null
  loading: boolean
  error: string | null
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ coords: null, loading: false, error: 'Geolocation is not supported by your browser.' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coords: { lat: position.coords.latitude, lng: position.coords.longitude },
          loading: false,
          error: null,
        })
      },
      (err) => {
        setState({ coords: null, loading: false, error: err.message })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  return state
}
