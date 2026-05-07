export interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: {
    lat: number
    lon: number
  }
  tags?: Record<string, string>
}

export interface OverpassResponse {
  elements: OverpassElement[]
}

export interface OsmStation {
  id: string
  name: string
  brand: string | null
  operator: string | null
  city: string
  province: string
  latitude: number
  longitude: number
}
