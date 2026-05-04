'use client'

import { useState, useCallback } from 'react'
import type { RoutePoint, RouteInfo } from '@/types/route'

const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || ''
const MISSING_KEY_ERROR = 'Missing Geoapify API key'

export function useRouteCalculationDev() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const geocodeAddress = useCallback(async (address: string): Promise<RoutePoint | null> => {
    if (!address.trim() || address === 'current') return null
    if (!GEOAPIFY_API_KEY) {
      setError(MISSING_KEY_ERROR)
      return null
    }

    try {
      setError(null)
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${GEOAPIFY_API_KEY}`
      )

      if (!response.ok) throw new Error('Geocoding failed')

      const data = await response.json()
      if (!data.features || data.features.length === 0) {
        setError('Address not found')
        return null
      }

      const feature = data.features[0]
      return {
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
        address: feature.properties.formatted || address,
      }
    } catch (err) {
      setError('Failed to geocode address')
      console.error('Geocoding error:', err)
      return null
    }
  }, [])

  const calculateRoute = useCallback(
    async (start: RoutePoint, end: RoutePoint): Promise<RouteInfo | null> => {
      if (!GEOAPIFY_API_KEY) {
        setError(MISSING_KEY_ERROR)
        return null
      }

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `https://api.geoapify.com/v1/routing?waypoints=${start.lat},${start.lng}|${end.lat},${end.lng}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`
        )

        if (!response.ok) throw new Error('Route calculation failed')

        const data = await response.json()
        if (!data.features || data.features.length === 0) {
          setError('No route found')
          return null
        }

        const route = data.features[0]
        const distanceKm = (route.properties.distance || 0) / 1000
        const durationMin = Math.round((route.properties.time || 0) / 60)

        return {
          startPoint: start,
          endPoint: end,
          distance: distanceKm,
          duration: durationMin,
          coordinates: route.geometry.coordinates,
        }
      } catch (err) {
        setError('Failed to calculate route')
        console.error('Route calculation error:', err)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { geocodeAddress, calculateRoute, loading, error }
}
