'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useRouteCalculationDev } from '@/hooks/use-route-calculation-dev'
import { useUserLocation } from '@/hooks/use-user-location'
import { RouteMap } from './route-map'
import type { RouteInfo, RoutePoint } from '@/types/route'

export function RoutePlannerDev() {
  const [startAddress, setStartAddress] = useState('')
  const [endAddress, setEndAddress] = useState('')
  const [route, setRoute] = useState<RouteInfo | null>(null)
  const [calculatingRoute, setCalculatingRoute] = useState(false)

  const { geocodeAddress, calculateRoute, loading: geocodingLoading, error } = useRouteCalculationDev()
  const { location: userLocation } = useUserLocation()

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY ?? ''
    console.log('Geoapify key loaded:', Boolean(key), 'length:', key.length)
  }, [])

  async function handleCalculateRoute(e: React.FormEvent) {
    e.preventDefault()

    setCalculatingRoute(true)
    try {
      const useCurrentAsStart = startAddress === 'current'
      let startPoint: RoutePoint | null = null

      if (useCurrentAsStart && userLocation) {
        startPoint = {
          lat: userLocation.lat,
          lng: userLocation.lng,
          address: 'Your current location',
        }
      } else if (startAddress) {
        startPoint = await geocodeAddress(startAddress)
      }

      if (!startPoint) {
        alert('Please enter or select a valid starting point')
        return
      }

      const endPoint = await geocodeAddress(endAddress)
      if (!endPoint) {
        alert('Please enter a valid destination')
        return
      }

      console.log('===== ROUTE DEBUG START =====')
      console.log('START INPUT:', startAddress)
      console.log('DESTINATION INPUT:', endAddress)
      console.log('USE CURRENT AS START:', useCurrentAsStart)
      console.log('START COORDS:', { lat: startPoint.lat, lng: startPoint.lng })
      console.log('DESTINATION COORDS:', { lat: endPoint.lat, lng: endPoint.lng })
      console.log('===== ROUTE DEBUG END =====')

      const calculatedRoute = await calculateRoute(startPoint, endPoint)
      if (calculatedRoute) {
        setRoute(calculatedRoute)
      }
    } finally {
      setCalculatingRoute(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <h2 className="text-lg font-semibold mb-4">Plan Your Route</h2>

        <form onSubmit={handleCalculateRoute} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Starting Point</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter address or search..."
                value={startAddress}
                onChange={(e) => setStartAddress(e.target.value)}
              />
              {userLocation && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStartAddress('current')}
                  className="whitespace-nowrap"
                >
                  📍 Use Current
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Destination</label>
            <Input
              placeholder="Enter destination address..."
              value={endAddress}
              onChange={(e) => setEndAddress(e.target.value)}
            />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

          <Button
            type="submit"
            loading={geocodingLoading || calculatingRoute}
            className="w-full"
          >
            Calculate Route
          </Button>
        </form>
      </Card>

      {route && (
        <>
          <Card padding="lg">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted">From</p>
                <p className="font-medium">{route.startPoint.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted">To</p>
                <p className="font-medium">{route.endPoint.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <p className="text-sm text-muted">Distance</p>
                  <p className="text-2xl font-bold text-fuel-green">{route.distance.toFixed(1)} km</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Estimated travel time</p>
                  <p className="text-2xl font-bold text-fuel-green">{route.duration} min</p>
                </div>
              </div>
            </div>
          </Card>

          <RouteMap route={route} loading={calculatingRoute} />
        </>
      )}
    </div>
  )
}
