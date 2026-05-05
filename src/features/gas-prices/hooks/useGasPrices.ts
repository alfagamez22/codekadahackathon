'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchCommunityGasPrices } from '../api/gasPricesApi'
import { transformCommunityPrices } from '../utils/transformCommunityPrices'
import type { GasPriceItem } from '../types/gasPrice.types'

interface UseGasPricesState {
  gasPrices: GasPriceItem[]
  loading: boolean
  error: string | null
}

export function useGasPrices() {
  const [state, setState] = useState<UseGasPricesState>({
    gasPrices: [],
    loading: true,
    error: null,
  })

  const loadPrices = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const data = await fetchCommunityGasPrices()
      const gasPrices = transformCommunityPrices(data)
      setState({ gasPrices, loading: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load gas prices.'
      setState({ gasPrices: [], loading: false, error: message })
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPrices()
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [loadPrices])

  return {
    gasPrices: state.gasPrices,
    loading: state.loading,
    error: state.error,
    refetch: loadPrices,
  }
}
