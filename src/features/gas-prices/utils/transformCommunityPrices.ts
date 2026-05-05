import type { CommunityPricesResponse, GasPriceItem } from '../types/gasPrice.types'

export function transformCommunityPrices(data: CommunityPricesResponse): GasPriceItem[] {
  const results: GasPriceItem[] = []

  Object.entries(data.communityPrices).forEach(([stationId, fuelTypes]) => {
    if (!fuelTypes || typeof fuelTypes !== 'object') return

    Object.entries(fuelTypes).forEach(([fuelType, entry]) => {
      if (!entry || typeof entry !== 'object') return

      const typedEntry = entry as {
        price?: unknown
        note?: unknown
        timestamp?: unknown
        count?: unknown
      }

      if (typeof typedEntry.price !== 'number' || Number.isNaN(typedEntry.price)) return

      const timestamp = typeof typedEntry.timestamp === 'string' ? typedEntry.timestamp : ''
      const note = typeof typedEntry.note === 'string' ? typedEntry.note : ''
      const reportCount = typeof typedEntry.count === 'number' ? typedEntry.count : 0

      results.push({
        stationId,
        fuelType,
        price: typedEntry.price,
        note,
        timestamp,
        reportCount,
      })
    })
  })

  return results.sort((a, b) => {
    const aTime = Date.parse(a.timestamp)
    const bTime = Date.parse(b.timestamp)
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime)
  })
}
