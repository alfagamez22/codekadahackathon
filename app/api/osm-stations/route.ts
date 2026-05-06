import { NextResponse } from 'next/server'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const NCR_BBOX = {
  south: 14.36,
  west: 120.9,
  north: 14.83,
  east: 121.2,
}

const buildQuery = () => `
[out:json][timeout:25];
(
  node["amenity"="fuel"](${NCR_BBOX.south},${NCR_BBOX.west},${NCR_BBOX.north},${NCR_BBOX.east});
  way["amenity"="fuel"](${NCR_BBOX.south},${NCR_BBOX.west},${NCR_BBOX.north},${NCR_BBOX.east});
  relation["amenity"="fuel"](${NCR_BBOX.south},${NCR_BBOX.west},${NCR_BBOX.north},${NCR_BBOX.east});
);
out center tags;
`

export async function GET() {
  try {
    const body = new URLSearchParams({ data: buildQuery() })
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Accept: 'application/json',
        'User-Agent': 'codekada-gaswatchph/1.0 (contact: dev@codekada.app)',
      },
      body,
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      return NextResponse.json(
        { message: `Failed to fetch station locations from Overpass (status ${response.status}).` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error fetching stations.'
    return NextResponse.json({ message }, { status: 500 })
  }
}
