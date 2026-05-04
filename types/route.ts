export interface RoutePoint {
  lat: number
  lng: number
  address: string
}

export interface RouteInfo {
  startPoint: RoutePoint
  endPoint: RoutePoint
  distance: number // in kilometers
  duration: number // in minutes
  coordinates: Array<[number, number]> // lat, lng pairs
}

export interface GeoapifyGeoResult {
  features: Array<{
    geometry: {
      coordinates: [number, number]
    }
    properties: {
      address_line1?: string
      address_line2?: string
      formatted: string
    }
  }>
}

export interface GeoapifyRouteResponse {
  features: Array<{
    properties: {
      distance: number // meters
      time: number // seconds
    }
    geometry: {
      coordinates: Array<[number, number]>
    }
  }>
}
