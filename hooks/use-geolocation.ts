'use client'

import { useCallback, useEffect, useState } from 'react'

interface Coords {
  lat: number
  lng: number
}

interface GeolocationState {
  coords: Coords | null
  loading: boolean
  error: string | null
  statusMessage: string | null
  permission: PermissionState | 'unknown'
  requestLocation: () => void
}

interface GeolocationOptions {
  auto?: boolean
  statusMessage: string | null
  permission: PermissionState | 'unknown'
  requestLocation: () => void
}

interface GeolocationOptions {
  auto?: boolean
}

export function useGeolocation(options: GeolocationOptions = {}): GeolocationState {
  const { auto = true } = options
  const [state, setState] = useState<Omit<GeolocationState, 'requestLocation'>>({
export function useGeolocation(options: GeolocationOptions = {}): GeolocationState {
  const { auto = true } = options
  const [state, setState] = useState<Omit<GeolocationState, 'requestLocation'>>({
    coords: null,
    loading: auto,
    loading: auto,
    error: null,
    statusMessage: null,
    permission: 'unknown',
    statusMessage: null,
    permission: 'unknown',
  })

  const requestLocation = useCallback(() => {
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        coords: null,
        loading: false,
        error: 'Geolocation is not supported by your browser.',
        statusMessage: 'Your browser does not support location services.',
        permission: 'unknown',
      })
      setState({
        coords: null,
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
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        statusMessage: 'Requesting location permission...',
      }))

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({
            coords: { lat: position.coords.latitude, lng: position.coords.longitude },
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
            loading: false,
            error: message,
            statusMessage: message,
            permission: err.code === err.PERMISSION_DENIED ? 'denied' : 'unknown',
          })
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
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
    return () => window.clearTimeout(timeoutId)
  }, [auto, requestLocation])

  return { ...state, requestLocation }
}
