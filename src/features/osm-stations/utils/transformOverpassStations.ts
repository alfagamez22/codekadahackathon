import type { OverpassResponse, OsmStation } from '../types/osmStation.types'

const DEFAULT_CITY = 'Metro Manila'
const DEFAULT_PROVINCE = 'NCR'

export function transformOverpassStations(data: OverpassResponse): OsmStation[] {
  const stations: OsmStation[] = []

  data.elements.forEach((element) => {
    const lat = element.lat ?? element.center?.lat
    const lon = element.lon ?? element.center?.lon

    if (typeof lat !== 'number' || typeof lon !== 'number') return

    const tags = element.tags ?? {}
    const name = tags.name ?? tags.operator ?? tags.brand ?? 'Unnamed station'
    const brand = tags.brand ?? null
    const operator = tags.operator ?? null
    const city = tags['addr:city'] ?? tags['addr:municipality'] ?? DEFAULT_CITY
    const province = tags['addr:province'] ?? DEFAULT_PROVINCE

    stations.push({
      id: `${element.type}-${element.id}`,
      name,
      brand,
      operator,
      city,
      province,
      latitude: lat,
      longitude: lon,
    })
  })

  return stations
}
