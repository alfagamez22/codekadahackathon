import 'server-only'

export const DEFAULT_GASWATCHPH_DATA_URL = 'https://gaswatchph.com/js/data.js?v=20260505a'
const GAS_STATIONS_MARKER = 'const GAS_STATIONS'

export type GaswatchPriceMap = Record<string, number | null>

export type GaswatchStation = {
  id: number
  brand: string | null
  name: string
  area?: string
  lat: number
  lng: number
  prices: GaswatchPriceMap
}

export function getGaswatchDataUrl() {
  return process.env.GASWATCHPH_DATA_URL ?? DEFAULT_GASWATCHPH_DATA_URL
}

export async function fetchGaswatchScript() {
  const response = await fetch(getGaswatchDataUrl(), { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`GasWatchPH request failed (${response.status})`)
  }
  return response.text()
}

export function extractJsonArray(source: string, marker = GAS_STATIONS_MARKER) {
  const markerIndex = source.indexOf(marker)
  if (markerIndex === -1) {
    throw new Error('GAS_STATIONS marker not found in payload.')
  }

  const arrayStart = source.indexOf('[', markerIndex)
  if (arrayStart === -1) {
    throw new Error('GAS_STATIONS array start not found in payload.')
  }

  let depth = 0
  let inString = false
  let quoteChar = ''

  for (let i = arrayStart; i < source.length; i += 1) {
    const char = source[i]

    if (inString) {
      if (char === '\\') {
        i += 1
        continue
      }
      if (char === quoteChar) {
        inString = false
      }
      continue
    }

    if (char === '"' || char === "'") {
      inString = true
      quoteChar = char
      continue
    }

    if (char === '[') {
      depth += 1
      continue
    }

    if (char === ']') {
      depth -= 1
      if (depth === 0) {
        return source.slice(arrayStart, i + 1)
      }
    }
  }

  throw new Error('GAS_STATIONS array could not be parsed from payload.')
}

export function parseGaswatchStations(source: string) {
  return JSON.parse(extractJsonArray(source)) as GaswatchStation[]
}
