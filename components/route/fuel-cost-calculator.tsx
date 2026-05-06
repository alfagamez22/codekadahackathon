'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPeso, formatFuelType } from '@/lib/utils/format'
import type { FuelType } from '@/types/station'

const FUEL_TYPES: FuelType[] = ['gasoline', 'premium', 'diesel', 'kerosene', 'lpg']

interface FuelCostCalculatorProps {
  distanceKm: number
}

export function FuelCostCalculator({ distanceKm }: FuelCostCalculatorProps) {
  const [kmPerLiter, setKmPerLiter] = useState<number>(10)
  const [fuelType, setFuelType] = useState<FuelType>('gasoline')
  const [pricePerLiter, setPricePerLiter] = useState<number>(65)

  const { litersNeeded, estimatedCost } = useMemo(() => {
    if (!kmPerLiter || kmPerLiter <= 0) return { litersNeeded: 0, estimatedCost: 0 }
    const liters = distanceKm / kmPerLiter
    return { litersNeeded: liters, estimatedCost: liters * pricePerLiter }
  }, [distanceKm, kmPerLiter, pricePerLiter])

  return (
    <Card>
      <CardHeader><CardTitle>Fuel Cost Estimate</CardTitle></CardHeader>
      <div className="px-4 pb-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Fuel Type</label>
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value as FuelType)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {FUEL_TYPES.map((ft) => (
                <option key={ft} value={ft}>{formatFuelType(ft)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Price per Liter (₱)</label>
            <Input
              type="number"
              min={1}
              step={0.5}
              value={pricePerLiter}
              onChange={(e) => setPricePerLiter(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Vehicle Fuel Efficiency (km/L)</label>
          <Input
            type="number"
            min={1}
            step={0.5}
            value={kmPerLiter}
            onChange={(e) => setKmPerLiter(Number(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border text-center">
          <div>
            <p className="text-xs text-muted">Distance</p>
            <p className="text-lg font-bold">{distanceKm.toFixed(1)} km</p>
          </div>
          <div>
            <p className="text-xs text-muted">Liters Needed</p>
            <p className="text-lg font-bold">{litersNeeded.toFixed(2)} L</p>
          </div>
          <div>
            <p className="text-xs text-muted">Est. Cost</p>
            <p className="text-lg font-bold text-fuel-green">{formatPeso(estimatedCost)}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
