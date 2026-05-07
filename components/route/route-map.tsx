'use client'

import { useEffect, useRef, useState } from 'react'
import type * as Leaflet from 'leaflet'
import type { RouteInfo } from '@/types/route'
import type { NearbyStation } from '@/lib/route-planner-utils'
import { getPriceEntries, formatFuel, normalizeRouteCoordinates } from '@/lib/route-planner-utils'

interface RouteMapProps {
  route: RouteInfo | null
  loading?: boolean
  nearbyStations?: NearbyStation[]
  alternateRoute?: RouteInfo | null
  selectedStationId?: string | null
}

function createEndpointIcon(L: typeof import('leaflet'), color: string, label: string) {
  return L.divIcon({
    html: `
      <div style="position:relative;width:34px;height:34px;">
        <div style="position:absolute;left:5px;top:3px;width:24px;height:24px;background:${color};border:3px solid white;border-radius:999px;box-shadow:0 4px 14px rgba(15,23,42,.35);"></div>
        <div style="position:absolute;left:13px;top:11px;width:8px;height:8px;background:white;border-radius:999px;"></div>
        <div style="position:absolute;left:14px;top:24px;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:8px solid ${color};filter:drop-shadow(0 2px 2px rgba(15,23,42,.25));"></div>
        <span style="position:absolute;left:50%;top:-16px;transform:translateX(-50%);background:${color};color:white;font-size:10px;font-weight:700;border-radius:999px;padding:2px 7px;white-space:nowrap;">${label}</span>
      </div>
    `,
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 31],
  })
}

function createStationIcon(L: typeof import('leaflet'), isSelected: boolean, isDimmed: boolean, isRecommended: boolean) {
  const opacity = isDimmed ? 0.28 : 1
  const scale = isSelected ? 1.16 : 1
  const border = isSelected ? '#2563eb' : isRecommended ? '#16a34a' : '#ffffff'
  const background = isRecommended ? '#16a34a' : '#f97316'
  const filter = isDimmed ? 'grayscale(1) blur(1px)' : 'none'

  return L.divIcon({
    html: `
      <div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:${background};color:white;border:3px solid ${border};border-radius:999px;box-shadow:0 5px 16px rgba(15,23,42,.35);font-size:14px;opacity:${opacity};transform:scale(${scale});filter:${filter};transition:opacity .18s ease, transform .18s ease, filter .18s ease;">&#9981;</div>
    `,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 28],
  })
}

function routeToLeafletCoordinates(route: RouteInfo) {
  return normalizeRouteCoordinates(route.coordinates).map(([lat, lng]) => [lat, lng] as [number, number])
}

function cancelAnimationFrameRef(frameRef: { current: number | null }) {
  if (frameRef.current === null) return
  window.cancelAnimationFrame(frameRef.current)
  frameRef.current = null
}

function isMapConnected(map: Leaflet.Map | null) {
  if (!map) return false
  try {
    return map.getContainer().isConnected
  } catch {
    return false
  }
}

export function RouteMap({ route, loading, nearbyStations = [], alternateRoute, selectedStationId }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)
  const mapInstanceRef = useRef<Leaflet.Map | null>(null)
  const leafletRef = useRef<typeof Leaflet | null>(null)
  const endpointLayerRef = useRef<Leaflet.LayerGroup | null>(null)
  const routeLayerRef = useRef<Leaflet.LayerGroup | null>(null)
  const stationLayerRef = useRef<Leaflet.LayerGroup | null>(null)
  const readyFrameRef = useRef<number | null>(null)
  const fitFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
    let cancelled = false

    async function initMap() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (cancelled || !mapRef.current || mapInstanceRef.current) return

      leafletRef.current = L as unknown as typeof Leaflet

      const map = L.map(mapRef.current, {
        zoomControl: true,
        zoomAnimation: false,
        markerZoomAnimation: false,
        fadeAnimation: false,
      }).setView([14.5995, 120.9842], 11)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      endpointLayerRef.current = L.layerGroup().addTo(map)
      routeLayerRef.current = L.layerGroup().addTo(map)
      stationLayerRef.current = L.layerGroup().addTo(map)
      mapInstanceRef.current = map
      map.whenReady(() => {
        readyFrameRef.current = window.requestAnimationFrame(() => {
          readyFrameRef.current = null
          if (cancelled || mapInstanceRef.current !== map || !isMapConnected(map)) return
          map.invalidateSize()
          setMapReady(true)
        })
      })
    }

    initMap()

    return () => {
      cancelled = true
      cancelAnimationFrameRef(readyFrameRef)
      cancelAnimationFrameRef(fitFrameRef)
      const map = mapInstanceRef.current
      if (map) {
        map.stop()
        map.off()
        map.remove()
      }
      mapInstanceRef.current = null
      endpointLayerRef.current = null
      routeLayerRef.current = null
      stationLayerRef.current = null
      leafletRef.current = null
    }
  }, [])

  useEffect(() => {
    const L = leafletRef.current as typeof import('leaflet') | null
    const map = mapInstanceRef.current
    const endpointLayer = endpointLayerRef.current
    const routeLayer = routeLayerRef.current
    if (!L || !map || !endpointLayer || !routeLayer || !mapReady || !route) return

    endpointLayer.clearLayers()
    routeLayer.clearLayers()

    L.circle([route.startPoint.lat, route.startPoint.lng], {
      radius: 320,
      color: '#2563eb',
      fillColor: '#2563eb',
      fillOpacity: 0.1,
      weight: 1,
    }).addTo(endpointLayer)

    L.circle([route.endPoint.lat, route.endPoint.lng], {
      radius: 320,
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.08,
      weight: 1,
    }).addTo(endpointLayer)

    L.marker([route.startPoint.lat, route.startPoint.lng], {
      icon: createEndpointIcon(L, '#2563eb', 'Start'),
      zIndexOffset: 900,
    })
      .addTo(endpointLayer)
      .bindPopup(`Start: ${route.startPoint.address}`)

    L.marker([route.endPoint.lat, route.endPoint.lng], {
      icon: createEndpointIcon(L, '#ef4444', 'Destination'),
      zIndexOffset: 900,
    })
      .addTo(endpointLayer)
      .bindPopup(`Destination: ${route.endPoint.address}`)

    const mainCoordinates = routeToLeafletCoordinates(route)
    const allCoordinates = [...mainCoordinates]

    if (mainCoordinates.length >= 2) {
      L.polyline(mainCoordinates, {
        color: '#16a34a',
        weight: 6,
        opacity: 0.85,
        smoothFactor: 1,
      }).addTo(routeLayer).bringToFront()
    }

    if (alternateRoute) {
      const alternateCoordinates = routeToLeafletCoordinates(alternateRoute)
      if (alternateCoordinates.length >= 2) {
        allCoordinates.push(...alternateCoordinates)
        L.polyline(alternateCoordinates, {
          color: '#2563eb',
          weight: 6,
          opacity: 0.9,
          smoothFactor: 1,
        }).addTo(routeLayer).bringToFront()
      }
    }

    cancelAnimationFrameRef(fitFrameRef)
    fitFrameRef.current = window.requestAnimationFrame(() => {
      fitFrameRef.current = null
      if (mapInstanceRef.current !== map || !isMapConnected(map)) return
      map.invalidateSize()
      if (allCoordinates.length >= 2) {
        map.fitBounds(L.latLngBounds(allCoordinates), { animate: false, padding: [48, 48] })
      } else {
        map.fitBounds(
          L.latLngBounds([
            [route.startPoint.lat, route.startPoint.lng],
            [route.endPoint.lat, route.endPoint.lng],
          ]),
          { animate: false, padding: [48, 48] },
        )
      }
    })

    return () => cancelAnimationFrameRef(fitFrameRef)
  }, [route, alternateRoute, mapReady])

  useEffect(() => {
    const L = leafletRef.current as typeof import('leaflet') | null
    const layer = stationLayerRef.current
    if (!L || !layer || !mapReady) return

    layer.clearLayers()

    nearbyStations.forEach((station, index) => {
      const isSelected = selectedStationId === station.id
      const isDimmed = Boolean(selectedStationId) && !isSelected
      const priceRows = getPriceEntries(station.prices)
        .map(
          (entry) =>
            `<div style="display:flex;justify-content:space-between;gap:12px"><span style="color:#64748b">${formatFuel(entry.fuelType)}</span><span style="font-weight:700">PHP ${entry.price.toFixed(2)}</span></div>`,
        )
        .join('')

      const popupContent = `
        <div style="min-width:170px;font-family:sans-serif;font-size:12px">
          <div style="font-weight:700;font-size:13px;margin-bottom:2px">${station.name}</div>
          <div style="color:#64748b;margin-bottom:8px">${station.brand ?? 'Independent'}${station.area ? ` · ${station.area}` : ''}</div>
          ${priceRows || '<div style="color:#64748b">No prices reported yet.</div>'}
        </div>`

      const marker = L.marker([station.lat, station.lng], {
        icon: createStationIcon(L, isSelected, isDimmed, index === 0),
        opacity: isDimmed ? 0.72 : 1,
        zIndexOffset: isSelected ? 700 : index === 0 ? 500 : 0,
      })
        .addTo(layer)
        .bindPopup(popupContent)

      if (isSelected) marker.openPopup()
    })
  }, [nearbyStations, mapReady, selectedStationId])

  return (
    <div className="relative min-h-[400px] overflow-hidden rounded-lg border border-border shadow-sm">
      <div ref={mapRef} className="h-[420px] w-full" />
      {(loading || !mapReady) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/85 text-sm text-muted">
          Loading route map...
        </div>
      )}
    </div>
  )
}
