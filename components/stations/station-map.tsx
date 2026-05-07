'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type * as Leaflet from 'leaflet'
import type { MarkerCluster, MarkerClusterGroup, MarkerClusterGroupOptions } from 'leaflet.markercluster'
import type { StationListItem } from '@/types/station'

type StationPriceMap = Record<string, number | null | undefined>

type StationMapItem = StationListItem & {
  prices?: StationPriceMap
}

interface StationMapProps {
  stations: StationMapItem[]
  userLat?: number
  userLng?: number
  userHeading?: number | null
  showUserMarker?: boolean
  centerOnUser?: boolean
  highlightStationId?: string | null
  brandStyles?: Record<string, BrandStyleInput>
  onStationSelect?: (id: string) => void
  containerClassName?: string
  mapClassName?: string
  showMarkerPopup?: boolean
  routeCoordinates?: Array<[number, number]> | Array<Array<[number, number]>> | null
  alternativeRouteCoordinates?: Array<[number, number]> | Array<Array<[number, number]>> | null
}

function normalizeRouteCoordinates(coords: Array<[number, number]> | Array<Array<[number, number]>> | unknown): Array<[number, number]> {
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

type BrandStyle = {
  short: string
  background: string
  text: string
}

type BrandStyleInput = {
  short?: string
  color?: string
  background?: string
  textColor?: string
  text?: string
}

const BRAND_STYLES: Record<string, BrandStyle> = {
  shell: { short: 'SHL', background: '#FFD500', text: '#111111' },
  petron: { short: 'PTR', background: '#004B93', text: '#ffffff' },
  caltex: { short: 'CAL', background: '#E31937', text: '#ffffff' },
  phoenix: { short: 'PHX', background: '#FF6600', text: '#ffffff' },
  seaoil: { short: 'SEA', background: '#00A651', text: '#ffffff' },
  unioil: { short: 'UNI', background: '#1B3C73', text: '#ffffff' },
  jetti: { short: 'JET', background: '#C8102E', text: '#ffffff' },
  flyingv: { short: 'FLV', background: '#8B0000', text: '#ffffff' },
  cleanfuel: { short: 'CLN', background: '#00B4D8', text: '#ffffff' },
  total: { short: 'TOT', background: '#FF0000', text: '#ffffff' },
  ptt: { short: 'PTT', background: '#5B2C6F', text: '#ffffff' },
}

const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842]

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const formatFuelLabel = (fuelType: string) => {
  const labels: Record<string, string> = {
    diesel: 'Diesel',
    premiumDiesel: 'Premium Diesel',
    unleaded: 'Unleaded 91',
    egasoline: 'E-Gasoline',
    premium95: 'Premium 95',
    premium97: 'Premium 97',
    kerosene: 'Kerosene',
    gasoline: 'Gasoline',
    premium: 'Premium Gasoline',
    lpg: 'LPG',
  }

  return labels[fuelType] ?? fuelType
}

const buildPriceLines = (prices?: StationPriceMap) => {
  if (!prices) return ''

  const entries = Object.entries(prices).filter((entry): entry is [string, number] => typeof entry[1] === 'number')
  if (entries.length === 0) return ''

  const order = ['diesel', 'premiumDiesel', 'unleaded', 'egasoline', 'premium95', 'premium97', 'kerosene', 'gasoline', 'premium', 'lpg']
  entries.sort((a, b) => {
    const aIndex = order.indexOf(a[0])
    const bIndex = order.indexOf(b[0])
    if (aIndex === -1 && bIndex === -1) return a[0].localeCompare(b[0])
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  return `
    <div style="margin-top:8px;display:grid;gap:4px;font-size:12px;">
      ${entries
        .map(([fuelType, value]) => {
          const label = escapeHtml(formatFuelLabel(fuelType))
          return `<div><span style="font-weight:600;">${label}</span>: PHP ${value.toFixed(2)}</div>`
        })
        .join('')}
    </div>
  `
}

const getStationLabel = (station: StationListItem, brandStyles: Record<string, BrandStyle>) => {
  const brand = (station.brand ?? station.name ?? '').toLowerCase()
  for (const [key, style] of Object.entries(brandStyles)) {
    if (brand.includes(key)) return style.short
  }
  return (station.name ?? 'GAS').slice(0, 3).toUpperCase()
}

const getMarkerColors = (station: StationListItem, brandStyles: Record<string, BrandStyle>) => {
  const brand = (station.brand ?? station.name ?? '').toLowerCase()
  for (const [key, style] of Object.entries(brandStyles)) {
    if (brand.includes(key)) return { background: style.background, text: style.text }
  }
  return { background: '#16a34a', text: '#ffffff' }
}

const getFovPoints = (lat: number, lng: number, heading: number, radiusMeters = 120, halfAngleDeg = 24) => {
  const earthRadiusMeters = 6371000
  const toRad = (value: number) => (value * Math.PI) / 180
  const toDeg = (value: number) => (value * 180) / Math.PI

  const destinationPoint = (bearingDeg: number) => {
    const bearing = toRad(bearingDeg)
    const lat1 = toRad(lat)
    const lng1 = toRad(lng)
    const angularDistance = radiusMeters / earthRadiusMeters

    const sinLat1 = Math.sin(lat1)
    const cosLat1 = Math.cos(lat1)
    const sinAd = Math.sin(angularDistance)
    const cosAd = Math.cos(angularDistance)

    const lat2 = Math.asin(sinLat1 * cosAd + cosLat1 * sinAd * Math.cos(bearing))
    const lng2 = lng1 + Math.atan2(
      Math.sin(bearing) * sinAd * cosLat1,
      cosAd - sinLat1 * Math.sin(lat2),
    )

    return [toDeg(lat2), toDeg(lng2)] as [number, number]
  }

  const points: [number, number][] = [[lat, lng]]
  for (let angle = heading - halfAngleDeg; angle <= heading + halfAngleDeg; angle += 6) {
    points.push(destinationPoint(angle))
  }
  points.push([lat, lng])
  return points
}

export function StationMap({
  stations,
  userLat,
  userLng,
  userHeading,
  showUserMarker = true,
  centerOnUser = false,
  highlightStationId,
  brandStyles,
  onStationSelect,
  containerClassName,
  mapClassName,
  showMarkerPopup = true,
  routeCoordinates,
  alternativeRouteCoordinates,
}: StationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Leaflet.Map | null>(null)
  const markerLayerRef = useRef<MarkerClusterGroup | Leaflet.LayerGroup | null>(null)
  const userLayerRef = useRef<Leaflet.Marker | null>(null)
  const userAccuracyLayerRef = useRef<Leaflet.Circle | null>(null)
  const userFovLayerRef = useRef<Leaflet.Polygon | null>(null)
  const routeLayerRef = useRef<Leaflet.Polyline | null>(null)
  const altRouteLayerRef = useRef<Leaflet.Polyline | null>(null)
  const leafletRef = useRef<typeof Leaflet | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const hasUserLocation = userLat != null && userLng != null
  const hasMapData = stations.length > 0 || hasUserLocation
  const center = useMemo<[number, number]>(() => {
    if (hasUserLocation) return [userLat, userLng]
    const firstStation = stations[0]
    if (firstStation) return [firstStation.latitude, firstStation.longitude]
    return DEFAULT_CENTER
  }, [hasUserLocation, stations, userLat, userLng])



  const effectiveBrandStyles = useMemo(() => {
    const merged: Record<string, BrandStyle> = { ...BRAND_STYLES }
    for (const [key, value] of Object.entries(brandStyles ?? {})) {
      const normalizedKey = key.toLowerCase()
      const fallback = merged[normalizedKey]
      merged[normalizedKey] = {
        short: value.short ?? fallback?.short ?? key.slice(0, 3).toUpperCase(),
        background: value.color ?? value.background ?? fallback?.background ?? '#16a34a',
        text: value.textColor ?? value.text ?? fallback?.text ?? '#ffffff',
      }
    }
    return merged
  }, [brandStyles])

  const containerClasses = `relative w-full overflow-hidden rounded-xl border border-border${containerClassName ? ` ${containerClassName}` : ''}`
  const mapClasses = `w-full bg-gray-100 ${mapClassName ?? 'h-72 sm:h-96'}`

  // Single unified effect: load Leaflet → create map → place markers.
  // Merging into one effect eliminates the race condition between async map
  // initialization and marker placement that caused markers to disappear.
  useEffect(() => {
    if (!mapRef.current) return

    let cancelled = false

    async function syncMap() {
      // ── Step 1: Load Leaflet (cached after first import) ──────────
      if (!leafletRef.current) {
        const L = (await import('leaflet')).default
        await import('leaflet/dist/leaflet.css')
        await import('leaflet.markercluster')
        await import('leaflet.markercluster/dist/MarkerCluster.css')
        await import('leaflet.markercluster/dist/MarkerCluster.Default.css')

        if (cancelled || !mapRef.current) return
        leafletRef.current = L
      }

      const L = leafletRef.current

      // ── Step 2: Create the map instance once ──────────────────────
      if (!mapInstanceRef.current) {
        if (!mapRef.current) return
        const map = L.map(mapRef.current, { zoomControl: true }).setView(center, 13)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map)
        mapInstanceRef.current = map
        if (!cancelled) setMapReady(true)
      }

      if (cancelled) return

      const map = mapInstanceRef.current

      // ── Step 3: Update user location marker ───────────────────────
      if (userLayerRef.current) {
        map.removeLayer(userLayerRef.current)
        userLayerRef.current = null
      }
      if (userAccuracyLayerRef.current) {
        map.removeLayer(userAccuracyLayerRef.current)
        userAccuracyLayerRef.current = null
      }
      if (userFovLayerRef.current) {
        map.removeLayer(userFovLayerRef.current)
        userFovLayerRef.current = null
      }

      if (hasUserLocation && showUserMarker) {
        const userIcon = L.divIcon({
          html: `<div style="position:relative;width:18px;height:18px;"><span style="position:absolute;inset:-8px;border-radius:999px;background:rgba(37,99,235,0.22);"></span><span style="position:absolute;inset:0;border-radius:999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 0 0 2px rgba(37,99,235,0.35);"></span></div>`,
          className: '',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        })

        userLayerRef.current = L.marker([userLat, userLng], { icon: userIcon })
          .addTo(map)
          .bindPopup('You are here')

        userAccuracyLayerRef.current = L.circle([userLat, userLng], {
          radius: 45,
          color: '#2563eb',
          weight: 1,
          fillColor: '#2563eb',
          fillOpacity: 0.08,
        }).addTo(map)

        if (typeof userHeading === 'number' && Number.isFinite(userHeading)) {
          userFovLayerRef.current = L.polygon(getFovPoints(userLat, userLng, userHeading), {
            color: '#2563eb',
            weight: 1,
            fillColor: '#2563eb',
            fillOpacity: 0.12,
          }).addTo(map)
        }

        if (centerOnUser) {
          map.setView([userLat, userLng], Math.max(map.getZoom(), 15))
        }
      }

      // ── Step 4: Update station markers ────────────────────────────
      if (markerLayerRef.current) {
        map.removeLayer(markerLayerRef.current)
        markerLayerRef.current = null
      }

      const leafletWithCluster = L as typeof Leaflet & {
        markerClusterGroup?: (options?: MarkerClusterGroupOptions) => MarkerClusterGroup
      }

      const markerLayer = leafletWithCluster.markerClusterGroup
        ? leafletWithCluster.markerClusterGroup({
            maxClusterRadius: 1, // Reduced to 1 to ONLY cluster exact overlapping coordinates
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
            iconCreateFunction: (cluster: MarkerCluster) => {
              const count = cluster.getChildCount()
              return L.divIcon({
                html: `<div style="background:#0f172a;color:white;border-radius:999px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;box-shadow:0 2px 6px rgba(0,0,0,.3)">${count}</div>`,
                className: '',
                iconSize: [36, 36],
                iconAnchor: [18, 18],
              })
            },
          })
        : L.layerGroup()

      stations.forEach((station) => {
        const label = escapeHtml(getStationLabel(station, effectiveBrandStyles))
        const colors = getMarkerColors(station, effectiveBrandStyles)
        const isHighlighted = highlightStationId != null && station.id === highlightStationId
        const highlightRing = isHighlighted ? 'box-shadow:0 0 0 3px #f59e0b,0 3px 8px rgba(0,0,0,.35);transform:scale(1.1);' : 'box-shadow:0 3px 8px rgba(0,0,0,.35);'
        const pinWidth = 36
        const pinHeight = 46
        const stationIcon = L.divIcon({
          html: `<div style="position:relative;width:${pinWidth}px;height:${pinHeight}px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3));">` +
            `<div style="position:absolute;top:0;left:0;width:${pinWidth}px;height:${pinWidth}px;border-radius:50%;background:${colors.background};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:${colors.text};letter-spacing:0.5px;border:2.5px solid #fff;${highlightRing}">${label}</div>` +
            `<div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:12px solid ${colors.background};filter:drop-shadow(0 1px 1px rgba(0,0,0,.2));"></div>` +
            `</div>`,
          className: '',
          iconSize: [pinWidth, pinHeight],
          iconAnchor: [pinWidth / 2, pinHeight],
        })

        const marker = L.marker([station.latitude, station.longitude], { icon: stationIcon })

        if (showMarkerPopup) {
          const pricesHtml = buildPriceLines(station.prices)
          const title = `<div style="font-weight:600;">${escapeHtml(station.name)}</div>`
          const brandLine = station.brand ? escapeHtml(station.brand) : ''
          const locationLine = escapeHtml(station.city)
          const metaLine = brandLine ? `${brandLine} - ${locationLine}` : locationLine
          const metaHtml = metaLine ? `<div style="font-size:12px;color:#475569;">${metaLine}</div>` : ''
          marker.bindPopup(`<div style="min-width:200px;">${title}${metaHtml}${pricesHtml}</div>`)
        }

        if (onStationSelect) {
          marker.on('click', () => onStationSelect(station.id))
        }

        markerLayer.addLayer(marker)
      })

      markerLayer.addTo(map)
      markerLayerRef.current = markerLayer

      // ── Step 4.5: Update route polyline ───────────────────────────
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current)
        routeLayerRef.current = null
      }
      if (altRouteLayerRef.current) {
        map.removeLayer(altRouteLayerRef.current)
        altRouteLayerRef.current = null
      }

      if (routeCoordinates) {
        const routeCoords = normalizeRouteCoordinates(routeCoordinates)
        // Geoapify returns [lng, lat], Leaflet expects [lat, lng]
        const coordinates = routeCoords.map((coord) => [coord[1], coord[0]] as [number, number])
        
        if (coordinates.length >= 2) {
          routeLayerRef.current = L.polyline(coordinates, {
            color: '#16a34a', // green-600
            weight: 6,
            opacity: 0.8,
            smoothFactor: 1.0,
          }).addTo(map)
        }
      }

      if (alternativeRouteCoordinates) {
        const altRouteCoords = normalizeRouteCoordinates(alternativeRouteCoordinates)
        const altCoordinates = altRouteCoords.map((coord) => [coord[1], coord[0]] as [number, number])
        
        if (altCoordinates.length >= 2) {
          altRouteLayerRef.current = L.polyline(altCoordinates, {
            color: '#3b82f6', // blue-500
            weight: 5,
            opacity: 0.8,
            smoothFactor: 1.0,
            dashArray: '10, 10'
          }).addTo(map)
        }
      }

      // ── Step 5: Position the map ──────────────────────────────────
      if (!centerOnUser && stations.length > 0) {
        const bounds = L.latLngBounds(stations.map((station) => [station.latitude, station.longitude]))
        if (hasUserLocation) bounds.extend([userLat, userLng])
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 })
      } else if (!centerOnUser) {
        map.setView(center, 13)
      }
    }

    syncMap()

    return () => {
      cancelled = true
    }
  }, [center, centerOnUser, effectiveBrandStyles, hasUserLocation, highlightStationId, onStationSelect, showMarkerPopup, showUserMarker, stations, userHeading, userLat, userLng, routeCoordinates, alternativeRouteCoordinates])

  // Destroy the map when the component unmounts to prevent memory leaks.
  useEffect(() => {
    return () => {
      try {
        mapInstanceRef.current?.remove()
      } catch { /* Leaflet may throw during teardown animation — safe to ignore */ }
      mapInstanceRef.current = null
      leafletRef.current = null
      markerLayerRef.current = null
      userLayerRef.current = null
      userAccuracyLayerRef.current = null
      userFovLayerRef.current = null
      routeLayerRef.current = null
    }
  }, [])

  return (
    <div className={containerClasses}>
      <div ref={mapRef} className={mapClasses} />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-muted text-sm">
          Loading map...
        </div>
      )}
      {mapReady && !hasMapData && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-muted text-sm">
          No stations to display.
        </div>
      )}
    </div>
  )
}
