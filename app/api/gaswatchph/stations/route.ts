import { NextResponse } from 'next/server'
<<<<<<< HEAD
import { fetchGaswatchScript, parseGaswatchStations } from '@/lib/gaswatchph'

export async function GET() {
  try {
    const body = await fetchGaswatchScript()
    const stations = parseGaswatchStations(body)
=======

const GASWATCHPH_URL = 'https://gaswatchph.com/js/data.js?v=20260505a'
const GAS_STATIONS_MARKER = 'const GAS_STATIONS'

type GaswatchStation = {
  id: number
  brand: string | null
  name: string
  area?: string
  lat: number
  lng: number
  prices: Record<string, number | null>
}

const extractJsonArray = (source: string, marker: string) => {
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

export async function GET() {
  try {
    const res = await fetch(GASWATCHPH_URL, { cache: 'no-store' })

    if (!res.ok) {
      return NextResponse.json(
        { error: `GasWatchPH request failed (${res.status})` },
        { status: res.status },
      )
    }

    const body = await res.text()
    const stationsJson = extractJsonArray(body, GAS_STATIONS_MARKER)
    const stations = JSON.parse(stationsJson) as GaswatchStation[]
>>>>>>> 2321e2b4c04c270e04ec48f092a77eaa6b73d49a

    return NextResponse.json({ stations })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
