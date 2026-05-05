import type { CommunityPricesResponse } from '../types/gasPrice.types'

const COMMUNITY_PRICES_URL = '/api/community-prices'

type UnknownRecord = Record<string, unknown>

const hasCommunityPrices = (data: unknown): data is CommunityPricesResponse => {
  if (!data || typeof data !== 'object') return false
  return 'communityPrices' in (data as UnknownRecord)
}

export async function fetchCommunityGasPrices(): Promise<CommunityPricesResponse> {
  const response = await fetch(COMMUNITY_PRICES_URL, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch community gas prices. Please try again.')
  }

  const data: unknown = await response.json()

  if (!hasCommunityPrices(data)) {
    throw new Error('Community prices data is missing from the response.')
  }

  return data
}
