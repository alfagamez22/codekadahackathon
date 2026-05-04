'use client'

import { useEffect, useRef, useState } from 'react'
import type { RouteInfo } from '@/types/route'

interface RouteMapProps {
  route: RouteInfo | null
  loading?: boolean
}

type RouteCoordinates = Array<[number, number]> | Array<Array<[number, number]>>

function normalizeRouteCoordinates(coords: RouteCoordinates | unknown): Array<[number, number]> {
  if (!Array.isArray(coords) || coords.length === 0) return []

  const first = coords[0] as unknown
  if (Array.isArray(first) && typeof first[0] === 'number' && typeof first[1] === 'number') {
    return coords as Array<[number, number]>
  }

  if (Array.isArray(first) && Array.isArray(first[0])) {
    const flattened: Array<[number, number]> = []
    for (const line of coords as Array<Array<[number, number]>>) {
      if (!Array.isArray(line)) continue
      for (const pair of line) {
        if (Array.isArray(pair) && typeof pair[0] === 'number' && typeof pair[1] === 'number') {
          flattened.push([pair[0], pair[1]])
        }
      }
    }
    return flattened
  }

  return []
}

export function RouteMap({ route, loading }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)
  const mapInstanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || !route) return
    const activeRoute = route

    async function initMap() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      if (mapInstanceRef.current) {
        (mapInstanceRef.current as any).remove()
      }

      const centerLat = (activeRoute.startPoint.lat + activeRoute.endPoint.lat) / 2
      const centerLng = (activeRoute.startPoint.lng + activeRoute.endPoint.lng) / 2

      const map = L.map(mapRef.current!, { zoomControl: true }).setView([centerLat, centerLng], 12)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      // Start marker
      const startIcon = L.divIcon({
        html: '<div style="background:#10b981;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,.3)">A</div>',
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      })

      L.marker([activeRoute.startPoint.lat, activeRoute.startPoint.lng], { icon: startIcon })
        .addTo(map)
        .bindPopup(`Start: ${activeRoute.startPoint.address}`)

      // End marker
      const endIcon = L.divIcon({
        html: '<div style="background:#ef4444;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,.3)">B</div>',
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      })

      L.marker([activeRoute.endPoint.lat, activeRoute.endPoint.lng], { icon: endIcon })
        .addTo(map)
        .bindPopup(`Destination: ${activeRoute.endPoint.address}`)

      // Route polyline
      const routeCoords = normalizeRouteCoordinates(activeRoute.coordinates)
      const coordinates = routeCoords.map((coord) => [coord[1], coord[0]] as [number, number])
      if (coordinates.length >= 2) {
        L.polyline(coordinates, {
          color: '#16a34a',
          weight: 3,
          opacity: 0.7,
          smoothFactor: 1.0,
        }).addTo(map)
      }

      // Fit bounds
      if (coordinates.length >= 2) {
        const bounds = L.latLngBounds(coordinates)
        map.fitBounds(bounds, { padding: [50, 50] })
      } else {
        const fallbackBounds = L.latLngBounds([
          [activeRoute.startPoint.lat, activeRoute.startPoint.lng],
          [activeRoute.endPoint.lat, activeRoute.endPoint.lng],
        ])
        map.fitBounds(fallbackBounds, { padding: [50, 50] })
      }

      mapInstanceRef.current = map
      setMapReady(true)
    }

    initMap()
  }, [route])

  return (
    <div
      ref={mapRef}
      className="w-full h-96 rounded-lg border border-border shadow-sm"
      style={{ minHeight: '400px' }}
    />
  )
}
