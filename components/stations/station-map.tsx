'use client'

import { useEffect, useRef, useState } from 'react'
import type { StationListItem } from '@/types/station'
import type { MarkerCluster, MarkerClusterGroup, MarkerClusterGroupOptions } from 'leaflet.markercluster'

type StationPriceMap = Record<string, number | null | undefined>

type StationMapItem = StationListItem & {
  prices?: StationPriceMap
}

interface StationMapProps {
  stations: StationMapItem[]
  userLat?: number
  userLng?: number
  showUserMarker?: boolean
  onStationSelect?: (id: string) => void
  containerClassName?: string
  mapClassName?: string
  showMarkerPopup?: boolean
}

export function StationMap({
  stations,
  userLat,
  userLng,
  showUserMarker = true,
  onStationSelect,
  containerClassName,
  mapClassName,
  showMarkerPopup = true,
}: StationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)
  const [hasMapData, setHasMapData] = useState(true)
  const mapInstanceRef = useRef<unknown>(null)
  const containerClasses = `relative w-full rounded-xl overflow-hidden border border-border${containerClassName ? ` ${containerClassName}` : ''}`
  const mapClasses = `w-full bg-gray-100 ${mapClassName ?? 'h-72 sm:h-96'}`

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

  const formatPrice = (price: number) => `PHP ${price.toFixed(2)}`

  const buildPriceLines = (prices?: StationPriceMap) => {
    if (!prices) return ''

    const entries = Object.entries(prices).filter(([, value]) => typeof value === 'number') as Array<[string, number]>
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
            return `<div><span style=\"font-weight:600;\">${label}</span>: ${formatPrice(value)}</div>`
          })
          .join('')}
      </div>
    `
  }

  const getStationLabel = (station: StationListItem) => {
    const brand = (station.brand ?? station.name ?? '').toLowerCase()
    if (brand.includes('shell')) return 'SHL'
    if (brand.includes('caltex')) return 'CAL'
    if (brand.includes('petron')) return 'PTR'
    if (brand.includes('seaoil')) return 'SEO'
    if (brand.includes('phoenix')) return 'PHX'
    return (station.name ?? 'GAS').slice(0, 3).toUpperCase()
  }

  const getMarkerColors = (station: StationListItem) => {
    const brand = (station.brand ?? station.name ?? '').toLowerCase()
    if (brand.includes('petron')) return { background: '#2563eb', text: '#ffffff' }
    if (brand.includes('caltex')) return { background: '#ef4444', text: '#ffffff' }
    if (brand.includes('shell')) return { background: '#f59e0b', text: '#1f2937' }
    return { background: '#16a34a', text: '#ffffff' }
  }

  useEffect(() => {
    if (!mapRef.current) return

    if (mapInstanceRef.current) {
      ;(mapInstanceRef.current as { remove?: () => void }).remove?.()
      mapInstanceRef.current = null
    }

    setMapReady(false)
    setHasMapData(true)

    let cancelled = false

    async function initMap() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      await import('leaflet.markercluster')
      await import('leaflet.markercluster/dist/MarkerCluster.css')
      await import('leaflet.markercluster/dist/MarkerCluster.Default.css')

      if (cancelled) return

      const hasUserLocation = userLat != null && userLng != null
      const shouldShowUserMarker = hasUserLocation && showUserMarker
      const firstStation = stations[0]
      if (!hasUserLocation && !firstStation) {
        setHasMapData(false)
        setMapReady(true)
        return
      }

      const centerLat = hasUserLocation ? userLat : firstStation!.latitude
      const centerLng = hasUserLocation ? userLng : firstStation!.longitude

      const map = L.map(mapRef.current!, { zoomControl: true }).setView([centerLat, centerLng], 13)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      if (shouldShowUserMarker) {
        L.circleMarker([userLat!, userLng!], {
          radius: 8,
          color: '#16a34a',
          fillColor: '#16a34a',
          fillOpacity: 0.4,
        }).addTo(map).bindPopup('Your location')
      }

      const clusterFactory = (L as typeof L & {
        markerClusterGroup: (options?: MarkerClusterGroupOptions) => MarkerClusterGroup
      }).markerClusterGroup

      const clusterGroup = clusterFactory({
        maxClusterRadius: 60,
        showCoverageOnHover: false,
        iconCreateFunction: (cluster: MarkerCluster) => {
          const count = cluster.getChildCount()
          return L.divIcon({
            html: `<div style="background:#0f172a;color:white;border-radius:999px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;box-shadow:0 2px 6px rgba(0,0,0,.3)">${count}</div>`,
            className: '',
            iconSize: [36, 36],
            iconAnchor: [18, 36],
          })
        },
      })

      stations.forEach((station) => {
        const label = getStationLabel(station)
        const colors = getMarkerColors(station)
        const stationIcon = L.divIcon({
          html: `<div style="background:${colors.background};color:${colors.text};border-radius:999px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.3)">${label}</div>`,
          className: '',
          iconSize: [34, 34],
          iconAnchor: [17, 34],
        })

        const marker = L.marker([station.latitude, station.longitude], { icon: stationIcon })

        if (showMarkerPopup) {
          const pricesHtml = buildPriceLines(station.prices)
          const title = `<div style=\"font-weight:600;\">${escapeHtml(station.name)}</div>`
          const brandLine = station.brand ? escapeHtml(station.brand) : ''
          const locationLine = escapeHtml(station.city)
          const metaLine = brandLine ? `${brandLine} - ${locationLine}` : locationLine
          const metaHtml = metaLine ? `<div style=\"font-size:12px;color:#475569;\">${metaLine}</div>` : ''
          const popupHtml = `<div style=\"min-width:200px;\">${title}${metaHtml}${pricesHtml}</div>`
          marker.bindPopup(popupHtml)
        }

        if (onStationSelect) {
          marker.on('click', () => onStationSelect(station.id))
        }

        clusterGroup.addLayer(marker)
      })

      map.addLayer(clusterGroup)

      mapInstanceRef.current = map
      setMapReady(true)
    }

    initMap()

    return () => {
      cancelled = true
    }
  }, [stations, userLat, userLng, onStationSelect, showMarkerPopup, showUserMarker])

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
