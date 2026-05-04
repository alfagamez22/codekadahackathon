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
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minConfirmations, flagThreshold, reportExpiryHours }),
    })
    setSaving(false)
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
      <Button type="submit" loading={saving}>
        {saved ? '✓ Saved' : 'Save Changes'}
      </Button>
    </form>
  )
}
