import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

type ChatMessage = { role: 'user' | 'assistant'; content: string }

type VehicleProfile = {
  brand: string
  model: string
  type: string
  year: string
  engineDisplacementLiters: string
  transmission: string
  fuelType: string
}

type AiStationSummary = {
  id: string
  name: string
  brand: string | null
  area?: string
  distanceKm?: number
  etaMinutes: number | null
  prices: Record<string, number | null>
}

type RequestBody = {
  messages: ChatMessage[]
  context: {
    location: string
    vehicle: VehicleProfile | null
    stations: AiStationSummary[]
  }
}

const SYSTEM_PROMPT =
  'You are a fuel station advisor. Use the provided context to recommend the best station. ' +
  'Balance price, ETA, and vehicle details (fuel type, engine displacement, transmission). ' +
  'If data is missing, call it out and explain assumptions. Provide a short ranked list with reasons.'

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 })
  }

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const messages = Array.isArray(body.messages) ? body.messages : []
  const context = body.context ?? { location: 'Unknown', vehicle: null, stations: [] }

  const payloadMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Context JSON:\n${JSON.stringify(context)}` },
    ...messages.map((message) => ({ role: message.role, content: message.content })),
  ]

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: payloadMessages,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: 'OpenAI request failed', detail: errorText }, { status: 500 })
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }

    const reply = data.choices?.[0]?.message?.content?.trim() || 'No response yet.'
    return NextResponse.json({ reply })
  } catch (error) {
    console.error('OpenAI request error:', error)
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 })
  }
}
