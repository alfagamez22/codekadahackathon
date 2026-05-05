import { NextResponse } from 'next/server'

const COMMUNITY_PRICES_URL = 'https://gaswatchph.com/api/community-prices'

export async function GET() {
  try {
    const response = await fetch(COMMUNITY_PRICES_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Failed to fetch community gas prices.' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error fetching prices.'
    return NextResponse.json({ message }, { status: 500 })
  }
}
