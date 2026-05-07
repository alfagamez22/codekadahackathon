import { NextResponse } from 'next/server'
import { fetchGaswatchScript, parseGaswatchStations } from '@/lib/gaswatchph'

export async function GET() {
  try {
    const body = await fetchGaswatchScript()
    const stations = parseGaswatchStations(body)

    return NextResponse.json({ stations })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
