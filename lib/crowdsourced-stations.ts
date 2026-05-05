type UnknownRecord = Record<string, unknown>

const COMMUNITY_PRICES_URL = '/api/community-prices'

export async function crowdSourcedStations(): Promise<UnknownRecord> {
  const response = await fetch(COMMUNITY_PRICES_URL, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch crowd-sourced stations.')
  }

  return response.json() as Promise<UnknownRecord>
}
