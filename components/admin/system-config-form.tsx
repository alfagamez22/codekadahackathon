'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { getSystemConfig } from '@/lib/firebase-admin/firestore'

type SystemConfig = Awaited<ReturnType<typeof getSystemConfig>>

interface SystemConfigFormProps {
  config: SystemConfig
}

export function SystemConfigForm({ config }: SystemConfigFormProps) {
  const [minConfirmations, setMinConfirmations] = useState(config.minConfirmations)
  const [flagThreshold, setFlagThreshold] = useState(config.flagThreshold)
  const [reportExpiryHours, setReportExpiryHours] = useState(config.reportExpiryHours)
  const [reportCooldownHours, setReportCooldownHours] = useState(config.reportCooldownHours)
  const [priceTolerancePercent, setPriceTolerancePercent] = useState(config.priceTolerancePercent)
  const [stalePriceDays, setStalePriceDays] = useState(config.stalePriceDays)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const response = await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        minConfirmations,
        flagThreshold,
        reportExpiryHours,
        reportCooldownHours,
        priceTolerancePercent,
        stalePriceDays,
      }),
    })

    const result = (await response.json()) as { error?: string }
    setSaving(false)

    if (!response.ok) {
      setError(result.error ?? 'Failed to save settings')
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md flex flex-col gap-4">
      <Input
        label="Minimum Confirmations to Verify"
        type="number"
        min={1}
        max={10}
        value={minConfirmations}
        onChange={(e) => setMinConfirmations(Number(e.target.value))}
      />
      <Input
        label="Flag Threshold"
        type="number"
        min={1}
        max={10}
        value={flagThreshold}
        onChange={(e) => setFlagThreshold(Number(e.target.value))}
      />
      <Input
        label="Report Expiry (hours)"
        type="number"
        min={1}
        max={720}
        value={reportExpiryHours}
        onChange={(e) => setReportExpiryHours(Number(e.target.value))}
      />
      <Input
        label="Report Cooldown (hours)"
        type="number"
        min={1}
        max={168}
        value={reportCooldownHours}
        onChange={(e) => setReportCooldownHours(Number(e.target.value))}
      />
      <Input
        label="Price Tolerance (%)"
        type="number"
        min={0}
        max={100}
        step="0.1"
        value={priceTolerancePercent}
        onChange={(e) => setPriceTolerancePercent(Number(e.target.value))}
      />
      <Input
        label="Fresh Price Window (days)"
        type="number"
        min={1}
        max={365}
        value={stalePriceDays}
        onChange={(e) => setStalePriceDays(Number(e.target.value))}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" loading={saving}>
        {saved ? '✓ Saved' : 'Save Changes'}
      </Button>
    </form>
  )
}
