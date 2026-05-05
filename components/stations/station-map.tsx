'use client'

import { useEffect, useRef, useState } from 'react'
import type { StationListItem } from '@/types/station'
import type { MarkerCluster, MarkerClusterGroup, MarkerClusterGroupOptions } from 'leaflet.markercluster'

interface StationMapProps {
  stations: StationListItem[]
  userLat?: number
  userLng?: number
  onStationSelect?: (id: string) => void
}

export function StationMap({ stations, userLat, userLng, onStationSelect }: StationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)
  const [hasMapData, setHasMapData] = useState(true)
  const mapInstanceRef = useRef<unknown>(null)

  const getStationLabel = (station: StationListItem) => {
    const brand = (station.brand ?? station.name ?? '').toLowerCase()
    if (brand.includes('shell')) return 'SHL'
    if (brand.includes('caltex')) return 'CAL'
    if (brand.includes('petron')) return 'PTR'
    if (brand.includes('seaoil')) return 'SEO'
    if (brand.includes('phoenix')) return 'PHX'
    return (station.name ?? 'GAS').slice(0, 3).toUpperCase()
  }

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    async function initMap() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
  await import('leaflet.markercluster')
      await import('leaflet.markercluster/dist/MarkerCluster.css')
      await import('leaflet.markercluster/dist/MarkerCluster.Default.css')

      const hasUserLocation = userLat != null && userLng != null
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

      if (hasUserLocation) {
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
        const stationIcon = L.divIcon({
          html: `<div style="background:#16a34a;color:white;border-radius:999px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.3)">${label}</div>`,
          className: '',
          iconSize: [34, 34],
          iconAnchor: [17, 34],
        })

        const marker = L.marker([station.latitude, station.longitude], { icon: stationIcon })
          .bindPopup(`<strong>${station.name}</strong><br>${station.brand ?? ''}<br>${station.city}`)

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
  }, [stations, userLat, userLng, onStationSelect])

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border">
      <div ref={mapRef} className="h-72 sm:h-96 w-full bg-gray-100" />
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
