import { NextResponse } from 'next/server'

const COMMUNITY_PRICES_URL = 'https://gaswatchph.com/api/community-prices'

export async function GET() {
  try {
    const response = await fetch(COMMUNITY_PRICES_URL, {
      method: 'GET',
<<<<<<< HEAD
      headers: { Accept: 'application/json' },
=======
      headers: { 'Content-Type': 'application/json' },
>>>>>>> 2321e2b4c04c270e04ec48f092a77eaa6b73d49a
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Failed to fetch community gas prices.' },
<<<<<<< HEAD
        { status: response.status },
=======
        { status: response.status }
>>>>>>> 2321e2b4c04c270e04ec48f092a77eaa6b73d49a
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error fetching prices.'
    return NextResponse.json({ message }, { status: 500 })
  }
}
