'use client'

import { useEffect, useRef, useState } from 'react'
import type * as Leaflet from 'leaflet'
import type { RouteInfo } from '@/types/route'
import type { NearbyStation } from './route-planner'

interface RouteMapProps {
  route: RouteInfo | null
  loading?: boolean
  nearbyStations?: NearbyStation[]
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

export function RouteMap({ route, loading, nearbyStations = [] }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)
  const mapInstanceRef = useRef<Leaflet.Map | null>(null)
  const leafletRef = useRef<typeof Leaflet | null>(null)
  const stationLayerRef = useRef<Leaflet.LayerGroup | null>(null)

  useEffect(() => {
    if (!mapRef.current || !route) return
    const activeRoute = route

    async function initMap() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      leafletRef.current = L as unknown as typeof Leaflet

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
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

      // Station marker layer
      stationLayerRef.current = L.layerGroup().addTo(map)

      mapInstanceRef.current = map
      setMapReady(true)
    }

    initMap()

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
      stationLayerRef.current = null
      leafletRef.current = null
      setMapReady(false)
    }
  }, [route])

  useEffect(() => {
    const L = leafletRef.current as typeof import('leaflet') | null
    const layer = stationLayerRef.current
    if (!L || !layer || !mapReady) return

    layer.clearLayers()

    const PRICE_ORDER = ['diesel', 'premiumDiesel', 'unleaded', 'egasoline', 'premium95', 'premium97', 'kerosene']
    const FUEL_LABELS: Record<string, string> = {
      diesel: 'Diesel',
      premiumDiesel: 'Premium Diesel',
      unleaded: 'Unleaded 91',
      egasoline: 'E-Gasoline',
      premium95: 'Premium 95',
      premium97: 'Premium 97',
      kerosene: 'Kerosene',
    }

    for (const station of nearbyStations) {
      const entries = Object.entries(station.prices)
        .filter(([, v]) => typeof v === 'number')
        .map(([fuelType, value]) => ({ fuelType, price: value as number }))
        .sort((a, b) => {
          const ai = PRICE_ORDER.indexOf(a.fuelType)
          const bi = PRICE_ORDER.indexOf(b.fuelType)
          if (ai === -1 && bi === -1) return a.fuelType.localeCompare(b.fuelType)
          if (ai === -1) return 1
          if (bi === -1) return -1
          return ai - bi
        })

      const priceRows = entries
        .map(
          (e) =>
            `<div style="display:flex;justify-content:space-between;gap:12px"><span style="color:#888">${FUEL_LABELS[e.fuelType] ?? e.fuelType}</span><span style="font-weight:600">PHP ${e.price.toFixed(2)}</span></div>`
        )
        .join('')

      const popupContent = `
        <div style="min-width:160px;font-family:sans-serif;font-size:12px">
          <div style="font-weight:600;font-size:13px;margin-bottom:2px">${station.name}</div>
          <div style="color:#888;margin-bottom:8px">${station.brand ?? 'Independent'}${station.area ? ` · ${station.area}` : ''}</div>
          ${priceRows || '<div style="color:#888">No prices reported yet.</div>'}
        </div>`

      const stationIcon = (L as typeof import('leaflet')).divIcon({
        html: '<div style="background:#f97316;color:white;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,.35)">&#9981;</div>',
        className: '',
        iconSize: [26, 26],
        iconAnchor: [13, 26],
      })

      ;(L as typeof import('leaflet')).marker([station.lat, station.lng], { icon: stationIcon })
        .addTo(layer)
        .bindPopup(popupContent)
    }
  }, [nearbyStations, mapReady])

  return (
    <div className="relative min-h-[400px] overflow-hidden rounded-lg border border-border shadow-sm">
      <div ref={mapRef} className="h-96 w-full" />
      {(loading || !mapReady) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-sm text-muted">
          Loading route map...
        </div>
      )}
    </div>
  )
}
