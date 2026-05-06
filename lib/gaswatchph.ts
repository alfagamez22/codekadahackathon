import 'server-only'

export const DEFAULT_GASWATCHPH_DATA_URL = 'https://gaswatchph.com/js/data.js?v=20260505a'
const GAS_STATIONS_MARKER = 'const GAS_STATIONS'
const PRICE_HISTORY_MARKER = 'const PRICE_HISTORY'

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

export type GaswatchBrandPrices = {
  diesel: number
  unleaded: number
}

export type GaswatchPriceWeek = {
  week: string
  label: string
  dieselAvg: number
  unleadedAvg: number
  brands: Record<string, GaswatchBrandPrices>
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

/**
 * Converts a JS object literal string into valid JSON by:
 * 1. Stripping single-line `//` comments (outside strings)
 * 2. Quoting unquoted identifier keys (e.g. `shell:` → `"shell":`)
 * 3. Removing trailing commas before `}` or `]`
 */
export function normalizeJsToJson(raw: string): string {
  // Strip // comments (not inside strings)
  let result = ''
  let inString = false
  let quoteChar = ''
  let i = 0
  while (i < raw.length) {
    const ch = raw[i]
    if (inString) {
      result += ch
      if (ch === '\\') {
        i += 1
        if (i < raw.length) result += raw[i]
      } else if (ch === quoteChar) {
        inString = false
      }
      i += 1
      continue
    }
    if (ch === '"' || ch === "'") {
      inString = true
      quoteChar = ch
      // Normalize single-quoted strings to double-quoted
      result += '"'
      i += 1
      continue
    }
    if (ch === '/' && raw[i + 1] === '/') {
      // Skip to end of line
      while (i < raw.length && raw[i] !== '\n') i += 1
      continue
    }
    result += ch
    i += 1
  }

  // Quote unquoted identifier keys (word chars followed by colon not inside strings)
  result = result.replace(/([{,\s])([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*):/g, '$1"$2"$3:')

  // Remove trailing commas
  result = result.replace(/,(\s*[}\]])/g, '$1')

  return result
}

export function parsePriceHistory(source: string): GaswatchPriceWeek[] {
  try {
    const raw = extractJsonArray(source, PRICE_HISTORY_MARKER)
    return JSON.parse(normalizeJsToJson(raw)) as GaswatchPriceWeek[]
  } catch {
    return []
  }
}

/** Returns "YYYY-MM-DD" in Philippines time (Asia/Manila). */
export function getPhilippineDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * Returns the most recent PRICE_HISTORY week whose `week` value is ≤ todayPhDate.
 * The weeks are "week-start" dates (e.g. "2026-05-06" covers May 6–12).
 */
export function findCurrentWeekPrices(
  history: GaswatchPriceWeek[],
  todayPhDate: string,
): GaswatchPriceWeek | null {
  const sorted = [...history].sort((a, b) => b.week.localeCompare(a.week))
  return sorted.find((entry) => entry.week <= todayPhDate) ?? null
}
