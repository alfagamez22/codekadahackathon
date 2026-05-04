'use client'

import { useQuery } from '@tanstack/react-query'
import type { StationListItem } from '@/types/station'

interface SearchParams {
  province?: string
  city?: string
  brand?: string
  fuelType?: string
  search?: string
  page?: number
}

export function useStations(params: SearchParams = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') searchParams.set(k, String(v))
  })

  return useQuery({
    queryKey: ['stations', params],
    queryFn: async () => {
      const res = await fetch(`/api/stations?${searchParams.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch stations')
      return res.json() as Promise<{ stations: StationListItem[]; total: number; page: number; pageSize: number }>
    },
    staleTime: 60_000,
  })
}
