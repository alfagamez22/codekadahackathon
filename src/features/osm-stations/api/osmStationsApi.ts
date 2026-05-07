import type { OverpassResponse } from '../types/osmStation.types'

const OSM_STATIONS_URL = '/api/osm-stations'

type UnknownRecord = Record<string, unknown>

const hasElements = (data: unknown): data is OverpassResponse => {
  if (!data || typeof data !== 'object') return false
  return 'elements' in (data as UnknownRecord)
}

export async function fetchOsmStations(): Promise<OverpassResponse> {
  const response = await fetch(OSM_STATIONS_URL, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch NCR station locations. Please try again.')
  }

  const data: unknown = await response.json()

  if (!hasElements(data)) {
    throw new Error('Station location data is missing from the response.')
  }

  return data
}
