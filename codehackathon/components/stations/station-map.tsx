'use client'

import { useEffect, useRef, useState } from 'react'
import type { StationListItem } from '@/types/station'

interface StationMapProps {
  stations: StationListItem[]
  userLat?: number
  userLng?: number
  onStationSelect?: (id: string) => void
}

export function StationMap({ stations, userLat, userLng, onStationSelect }: StationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)
  const mapInstanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    async function initMap() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      const centerLat = userLat ?? stations[0]?.latitude ?? 14.5995
      const centerLng = userLng ?? stations[0]?.longitude ?? 120.9842

      const map = L.map(mapRef.current!, { zoomControl: true }).setView([centerLat, centerLng], 13)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      if (userLat && userLng) {
        L.circleMarker([userLat, userLng], {
          radius: 8,
          color: '#16a34a',
          fillColor: '#16a34a',
          fillOpacity: 0.4,
        }).addTo(map).bindPopup('Your location')
      }

      const stationIcon = L.divIcon({
        html: '<div style="background:#16a34a;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,.3)">⛽</div>',
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      })

      stations.forEach((station) => {
        const marker = L.marker([station.latitude, station.longitude], { icon: stationIcon })
          .addTo(map)
          .bindPopup(`<strong>${station.name}</strong><br>${station.brand ?? ''}<br>${station.city}`)

        if (onStationSelect) {
          marker.on('click', () => onStationSelect(station.id))
        }
      })

      mapInstanceRef.current = map
      setMapReady(true)
    }

    initMap()
  }, [])

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border">
      <div ref={mapRef} className="h-72 sm:h-96 w-full bg-gray-100" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-muted text-sm">
          Loading map...
        </div>
      )}
    </div>
  )
}
