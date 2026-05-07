import { NextResponse } from 'next/server'
import { fetchGaswatchScript } from '@/lib/gaswatchph'

export async function GET() {
  try {
    const body = await fetchGaswatchScript()

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
