'use client'

import { useState, useCallback } from 'react'
import type { RoutePoint, RouteInfo } from '@/types/route'

const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || 'test-key'

export function useRouteCalculation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const geocodeAddress = useCallback(async (address: string): Promise<RoutePoint | null> => {
    if (!address.trim()) return null

    try {
      setError(null)
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address.toLowerCase())}&filter=countrycode:ph&apiKey=${GEOAPIFY_API_KEY}`
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

  const fetchAutocompleteSuggestions = useCallback(async (query: string): Promise<RoutePoint[]> => {
    if (!query.trim()) return []
    
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query.toLowerCase())}&filter=countrycode:ph&apiKey=${GEOAPIFY_API_KEY}`
      )
      
      if (!response.ok) return []
      
      const data = await response.json()
      if (!data.features) return []
      
      return data.features.map((feature: any) => ({
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
        address: feature.properties.formatted || query,
      }))
    } catch (err) {
      console.error('Autocomplete error:', err)
      return []
    }
  }, [])

  const fetchRecommendedDestinations = useCallback(async (lat: number, lng: number, offset: number = 0, limit: number = 5): Promise<RoutePoint[]> => {
    try {
      const categories = 'commercial.shopping_mall,tourism.attraction,entertainment,catering.restaurant'
      const response = await fetch(
        `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lng},${lat},10000&bias=proximity:${lng},${lat}&limit=${limit}&offset=${offset}&apiKey=${GEOAPIFY_API_KEY}`
      )
      
      if (!response.ok) return []
      
      const data = await response.json()
      if (!data.features) return []
      
      return data.features.map((feature: any) => ({
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
        address: feature.properties.formatted || feature.properties.name || 'Unknown Location',
        name: feature.properties.name
      }))
    } catch (err) {
      console.error('Fetch recommendations error:', err)
      return []
    }
  }, [])

  const calculateRoute = useCallback(
    async (start: RoutePoint, end: RoutePoint): Promise<RouteInfo | null> => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `https://api.geoapify.com/v1/routing?waypoints=${start.lat},${start.lng}|${end.lat},${end.lng}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`
        )

        if (!response.ok) {
          setError(`no route for this: ${end.address} based on openstreetmap`)
          return null
        }

        const data = await response.json()
        if (!data.features || data.features.length === 0) {
          setError(`no route for this: ${end.address} based on openstreetmap`)
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
        setError(`no route for this: ${end.address} based on openstreetmap`)
        console.error('Route calculation error:', err)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { geocodeAddress, fetchAutocompleteSuggestions, fetchRecommendedDestinations, calculateRoute, loading, error }
}
