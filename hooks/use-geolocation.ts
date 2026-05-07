'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Coords {
  lat: number
  lng: number
}

interface GeolocationState {
  coords: Coords | null
  heading: number | null
  loading: boolean
  error: string | null
  statusMessage: string | null
  permission: PermissionState | 'unknown'
  requestLocation: () => void
}

interface GeolocationOptions {
  auto?: boolean
}

export function useGeolocation(options: GeolocationOptions = {}): GeolocationState {
  const { auto = true } = options
  const watchIdRef = useRef<number | null>(null)
  const [state, setState] = useState<Omit<GeolocationState, 'requestLocation'>>({
    coords: null,
    heading: null,
    loading: auto,
    error: null,
    statusMessage: null,
    permission: 'unknown',
  })

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        coords: null,
        heading: null,
        loading: false,
        error: 'Geolocation is not supported by your browser.',
        statusMessage: 'Your browser does not support location services.',
        permission: 'unknown',
      })
      return
    }

    const resolveErrorMessage = (err: GeolocationPositionError) => {
      if (err.code === err.PERMISSION_DENIED) {
        return 'Location access was denied. Enable it in your browser settings.'
      }
      if (err.code === err.POSITION_UNAVAILABLE) {
        return 'Location information is unavailable right now.'
      }
      if (err.code === err.TIMEOUT) {
        return 'Location request timed out. Please try again.'
      }
      return err.message || 'Unable to fetch your location.'
    }

    const requestPosition = () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        statusMessage: 'Requesting location permission...',
      }))

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          setState({
            coords: { lat: position.coords.latitude, lng: position.coords.longitude },
            heading: typeof position.coords.heading === 'number' ? position.coords.heading : null,
            loading: false,
            error: null,
            statusMessage: 'Location acquired successfully.',
            permission: 'granted',
          })
        },
        (err) => {
          const message = resolveErrorMessage(err)
          setState({
            coords: null,
            heading: null,
            loading: false,
            error: message,
            statusMessage: message,
            permission: err.code === err.PERMISSION_DENIED ? 'denied' : 'unknown',
          })
          if (watchIdRef.current != null) {
            navigator.geolocation.clearWatch(watchIdRef.current)
            watchIdRef.current = null
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 },
      )
    }

    if (!navigator.permissions?.query) {
      requestPosition()
      return
    }

    navigator.permissions
      .query({ name: 'geolocation' })
      .then((result) => {
        if (result.state === 'denied') {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: 'Location access is blocked. Enable it manually in your browser settings.',
            statusMessage: 'Location access is blocked. Enable it manually in your browser settings.',
            permission: 'denied',
          }))
          return
        }

        setState((prev) => ({
          ...prev,
          permission: result.state,
          statusMessage:
            result.state === 'granted'
              ? 'Permission already granted. Fetching location...'
              : 'Requesting location permission...',
        }))
        requestPosition()
      })
      .catch(() => requestPosition())
  }, [])

  useEffect(() => {
    if (!auto) return
    const timeoutId = window.setTimeout(() => requestLocation(), 0)
    return () => {
      window.clearTimeout(timeoutId)
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [auto, requestLocation])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const webkitEvent = event as DeviceOrientationEvent & { webkitCompassHeading?: number }
      let nextHeading: number | null = null

      if (typeof webkitEvent.webkitCompassHeading === 'number') {
        nextHeading = webkitEvent.webkitCompassHeading
      } else if (typeof event.alpha === 'number') {
        nextHeading = (360 - event.alpha) % 360
      }

      if (nextHeading == null || !Number.isFinite(nextHeading)) return

      setState((prev) => {
        if (prev.heading != null && Math.abs(prev.heading - nextHeading) < 1) return prev
        return { ...prev, heading: nextHeading }
      })
    }

    window.addEventListener('deviceorientationabsolute', handleOrientation, true)
    window.addEventListener('deviceorientation', handleOrientation, true)

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true)
      window.removeEventListener('deviceorientation', handleOrientation, true)
    }
  }, [])

  return { ...state, requestLocation }
}
