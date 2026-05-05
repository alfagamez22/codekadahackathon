import { NextResponse } from 'next/server'

const GASWATCHPH_URL = 'https://gaswatchph.com/js/data.js?v=20260505a'

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

    return new NextResponse(body, {
      status: 200,
      headers: {
        'content-type': 'application/javascript; charset=utf-8',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
