'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { FuelType } from '@/types/station'

const PROVINCES = ['Metro Manila', 'Cebu', 'Davao', 'Laguna', 'Cavite', 'Rizal', 'Bulacan', 'Pampanga', 'Batangas', 'Negros Occidental']
const BRANDS = ['Petron', 'Shell', 'Caltex', 'SeaOil', 'Phoenix', 'Jetti', 'Flying V', 'Unioil', 'Total']
const FUEL_TYPES: { value: FuelType; label: string }[] = [
  { value: 'gasoline', label: 'Gasoline' },
  { value: 'premium', label: 'Premium' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'kerosene', label: 'Kerosene' },
  { value: 'lpg', label: 'LPG' },
]

interface StationFiltersProps {
  onFilterChange: (filters: { province?: string; brand?: string; fuelType?: FuelType; search?: string }) => void
}

export function StationFilters({ onFilterChange }: StationFiltersProps) {
  const [search, setSearch] = useState('')
  const [province, setProvince] = useState('')
  const [brand, setBrand] = useState('')
  const [fuelType, setFuelType] = useState<FuelType | ''>('')

  function handleApply() {
    onFilterChange({
      province: province || undefined,
      brand: brand || undefined,
      fuelType: (fuelType as FuelType) || undefined,
      search: search || undefined,
    })
  }

  function handleReset() {
    setSearch('')
    setProvince('')
    setBrand('')
    setFuelType('')
    onFilterChange({})
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input
          placeholder="Search by name, brand, city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        />
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fuel-green"
        >
          <option value="">All Provinces</option>
          {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fuel-green"
        >
          <option value="">All Brands</option>
          {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select
          value={fuelType}
          onChange={(e) => setFuelType(e.target.value as FuelType)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fuel-green"
        >
          <option value="">All Fuel Types</option>
          {FUEL_TYPES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>
      <div className="flex gap-2 mt-3">
        <Button onClick={handleApply} size="sm">Apply Filters</Button>
        <Button onClick={handleReset} size="sm" variant="ghost">Reset</Button>
      </div>
    </div>
  )
}
