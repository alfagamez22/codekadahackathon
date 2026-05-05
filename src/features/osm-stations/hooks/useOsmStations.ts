'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchOsmStations } from '../api/osmStationsApi'
import { transformOverpassStations } from '../utils/transformOverpassStations'
import type { OsmStation } from '../types/osmStation.types'

interface UseOsmStationsState {
  stations: OsmStation[]
  loading: boolean
  error: string | null
}

export function useOsmStations() {
  const [state, setState] = useState<UseOsmStationsState>({
    stations: [],
    loading: true,
    error: null,
  })

  const loadStations = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const data = await fetchOsmStations()
      const stations = transformOverpassStations(data)
      setState({ stations, loading: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load NCR stations.'
      setState({ stations: [], loading: false, error: message })
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadStations()
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [loadStations])

  return {
    stations: state.stations,
    loading: state.loading,
    error: state.error,
    refetch: loadStations,
  }
}
