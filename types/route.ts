export interface RoutePoint {
  lat: number
  lng: number
  address: string
  name?: string
}

export interface RouteInfo {
  startPoint: RoutePoint
  endPoint: RoutePoint
  distance: number // in kilometers
  duration: number // in minutes
  providerDuration?: number // raw provider duration in minutes before local traffic adjustment
  coordinates: Array<[number, number]> | Array<Array<[number, number]>>
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
      coordinates: Array<[number, number]> | Array<Array<[number, number]>>
    }
  }>
}
